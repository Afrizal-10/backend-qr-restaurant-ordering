import {Prisma} from "@prisma/client";
import {ApiError} from "../middlewares/errorMiddleware";
import {generateOrderNumber} from "../utils/generateOrderNumber";
import {TAX_RATE, SERVICE_CHARGE_RATE} from "../config/constants";
import {CreateOrderInput, OrderStatusValue} from "../validators/orderValidator";
import {getIO} from "../sockets/socket";
import prisma from "../config/prisma";

const ORDER_STATUS_FLOW: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["SERVED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const ORDER_STATUS_EVENT: Record<OrderStatusValue, string> = {
  PENDING: "new_order",
  CONFIRMED: "order_confirmed",
  PREPARING: "order_preparing",
  READY: "order_ready",
  SERVED: "order_served",
  COMPLETED: "order_completed",
  CANCELLED: "order_cancelled",
};

const syncTableStatus = async (tableId: string) => {
  const stillActiveOrder = await prisma.order.findFirst({
    where: {
      tableId,
      status: {notIn: ["COMPLETED", "CANCELLED"]},
    },
  });

  if (!stillActiveOrder) {
    const updatedTable = await prisma.table.update({
      where: {id: tableId},
      data: {status: "AVAILABLE"},
    });

    getIO()
      .to("cashier")
      .to("admin")
      .emit("table_status_updated", updatedTable);
  }
};

export const createOrder = async (data: CreateOrderInput) => {
  const table = await prisma.table.findUnique({
    where: {qrToken: data.qrToken},
  });

  if (!table) {
    throw new ApiError(404, "QR tidak valid atau meja tidak ditemukan");
  }

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {id: {in: productIds}},
  });

  if (products.length !== new Set(productIds).size) {
    throw new ApiError(404, "Salah satu product tidak ditemukan");
  }

  const unavailableProduct = products.find(
    (product: {isAvailable: boolean}) => !product.isAvailable,
  );
  if (unavailableProduct) {
    throw new ApiError(
      422,
      `Product "${unavailableProduct.name}" sedang tidak tersedia`,
    );
  }

  const orderItemsData = data.items.map((item) => {
    const product = products.find(
      (p: {id: string}) => p.id === item.productId,
    )!;
    const price = Number(product.price);
    const subtotal = price * item.quantity;

    return {
      productId: item.productId,
      quantity: item.quantity,
      price,
      subtotal,
    };
  });

  const subtotal = orderItemsData.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * TAX_RATE;
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const total = subtotal + tax + serviceCharge;

  const order = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          tableId: table.id,
          subtotal,
          tax,
          serviceCharge,
          total,
          items: {create: orderItemsData},
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: "CASH",
          amount: total,
          status: "PENDING",
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
          changedBy: "SYSTEM",
        },
      });

      await tx.table.update({
        where: {id: table.id},
        data: {status: "OCCUPIED"},
      });

      return newOrder;
    },
  );

  getIO().to("cashier").to("admin").emit("new_order", order);
  getIO()
    .to("cashier")
    .to("admin")
    .emit("table_status_updated", {...table, status: "OCCUPIED"});

  return order;
};

export const getOrders = async () => {
  return prisma.order.findMany({
    include: {
      table: {select: {id: true, tableNumber: true}},
      items: {include: {product: {select: {id: true, name: true}}}},
      payment: true,
    },
    orderBy: {createdAt: "desc"},
  });
};

export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: {id},
    include: {
      table: {select: {id: true, tableNumber: true}},
      items: {include: {product: {select: {id: true, name: true}}}},
      payment: true,
      statusHistories: {orderBy: {createdAt: "asc"}},
    },
  });

  if (!order) {
    throw new ApiError(404, "Order tidak ditemukan");
  }

  return order;
};

export const updateOrderStatus = async (
  id: string,
  newStatus: OrderStatusValue,
  changedBy: string,
) => {
  const order = await prisma.order.findUnique({
    where: {id},
  });

  if (!order) {
    throw new ApiError(404, "Order tidak ditemukan");
  }

  const allowedNextStatuses =
    ORDER_STATUS_FLOW[order.status as OrderStatusValue];

  if (!allowedNextStatuses.includes(newStatus)) {
    throw new ApiError(
      400,
      `Tidak bisa mengubah status order dari ${order.status} ke ${newStatus}`,
    );
  }

  const updatedOrder = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      await tx.order.update({
        where: {id},
        data: {status: newStatus},
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: newStatus,
          changedBy,
        },
      });

      if (newStatus === "CONFIRMED") {
        const payment = await tx.payment.findUnique({where: {orderId: id}});
        if (payment && payment.method === "CASH" && payment.status !== "PAID") {
          await tx.payment.update({
            where: {id: payment.id},
            data: {status: "PAID", paidAt: new Date()},
          });
        }
      }

      return tx.order.findUnique({
        where: {id},
        include: {
          table: {
            select: {
              id: true,
              tableNumber: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payment: true,
          statusHistories: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    },
  );

  if (!updatedOrder) {
    throw new ApiError(404, "Order tidak ditemukan");
  }

  const eventName = ORDER_STATUS_EVENT[newStatus];

  getIO()
    .to(`order:${id}`)
    .to("cashier")
    .to("admin")
    .emit(eventName, updatedOrder);

  if (newStatus === "CONFIRMED" && updatedOrder.payment?.method === "CASH") {
    getIO()
      .to(`order:${id}`)
      .to("cashier")
      .to("admin")
      .emit("payment_updated", updatedOrder.payment);
  }

  await syncTableStatus(updatedOrder.tableId);

  return updatedOrder;
};

export const cancelOrder = async (id: string, changedBy: string) => {
  return updateOrderStatus(id, "CANCELLED", changedBy);
};

export const deleteOrder = async (id: string) => {
  const order = await prisma.order.findUnique({where: {id}});

  if (!order) {
    throw new ApiError(404, "Order tidak ditemukan");
  }

  if (order.status !== "COMPLETED") {
    throw new ApiError(
      400,
      "Hanya pesanan dengan status COMPLETED yang bisa dihapus",
    );
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.orderStatusHistory.deleteMany({where: {orderId: id}});
    await tx.payment.deleteMany({where: {orderId: id}});
    await tx.orderItem.deleteMany({where: {orderId: id}});
    await tx.order.delete({where: {id}});
  });
};
