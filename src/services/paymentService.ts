import {midtransCore} from "../config/midtrans";
import prisma from "../config/prisma";
import {ApiError} from "../middlewares/errorMiddleware";
import {getIO} from "../sockets/socket";

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

const mapMidtransStatus = (midtransStatus: string): PaymentStatusValue => {
  switch (midtransStatus) {
    case "settlement":
    case "capture":
      return "PAID";
    case "pending":
      return "PENDING";
    case "expire":
      return "EXPIRED";
    case "deny":
    case "cancel":
    case "failure":
      return "FAILED";
    default:
      return "PENDING";
  }
};

export const createQrisPayment = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: {id: orderId},
    include: {payment: true},
  });

  if (!order) {
    throw new ApiError(404, "Order tidak ditemukan");
  }

  if (!order.payment) {
    throw new ApiError(404, "Payment untuk order ini tidak ditemukan");
  }

  if (order.payment.status === "PAID") {
    throw new ApiError(409, "Order ini sudah dibayar");
  }

  const chargeResponse = await midtransCore.charge({
    payment_type: "qris",
    transaction_details: {
      order_id: order.orderNumber,
      gross_amount: Math.round(Number(order.total)),
    },
  });

  const qrAction = chargeResponse.actions?.find(
    (action: {name: string; url: string}) => action.name === "generate-qr-code",
  );

  if (!qrAction) {
    throw new ApiError(500, "Gagal mendapatkan QR code dari Midtrans");
  }

  await prisma.payment.update({
    where: {orderId: order.id},
    data: {
      method: "QRIS",
      transactionId: chargeResponse.transaction_id,
    },
  });

  return {
    qrCodeUrl: qrAction.url,
    orderNumber: order.orderNumber,
  };
};

export const checkQrisPaymentStatus = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: {id: orderId},
    include: {payment: true},
  });

  if (!order || !order.payment) {
    throw new ApiError(404, "Payment tidak ditemukan");
  }

  if (order.payment.status === "PAID") {
    return order.payment;
  }

  if (order.payment.method !== "QRIS" || !order.payment.transactionId) {
    throw new ApiError(
      400,
      "QRIS belum dibuat untuk order ini. Panggil POST /api/payments/:orderId/qris terlebih dahulu.",
    );
  }

  let statusResponse;
  try {
    statusResponse = await midtransCore.transaction.status(order.orderNumber);
  } catch (error) {
    throw new ApiError(500, "Gagal mengecek status pembayaran ke Midtrans");
  }

  const newStatus = mapMidtransStatus(statusResponse.transaction_status);

  const updatedPayment = await prisma.payment.update({
    where: {orderId: order.id},
    data: {
      status: newStatus,
      paidAt: newStatus === "PAID" ? new Date() : order.payment.paidAt,
    },
  });

  getIO()
    .to(`order:${orderId}`)
    .to("cashier")
    .to("admin")
    .emit("payment_updated", updatedPayment);

  return updatedPayment;
};

export const confirmCashPayment = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({where: {id: paymentId}});

  if (!payment) {
    throw new ApiError(404, "Payment tidak ditemukan");
  }

  if (payment.method !== "CASH") {
    throw new ApiError(
      422,
      "Endpoint ini hanya untuk konfirmasi pembayaran CASH",
    );
  }

  if (payment.status === "PAID") {
    throw new ApiError(409, "Payment ini sudah dikonfirmasi sebelumnya");
  }

  const updatedPayment = await prisma.payment.update({
    where: {id: paymentId},
    data: {status: "PAID", paidAt: new Date()},
  });

  getIO()
    .to(`order:${payment.orderId}`)
    .to("cashier")
    .to("admin")
    .emit("payment_updated", updatedPayment);

  return updatedPayment;
};

export const getPaymentById = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: {id},
    include: {
      order: {select: {id: true, orderNumber: true, total: true}},
    },
  });

  if (!payment) {
    throw new ApiError(404, "Payment tidak ditemukan");
  }

  return payment;
};
