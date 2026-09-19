import prisma from "../config/prisma";

const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const sumPaidOrders = (orders: {total: unknown}[]) => {
  return orders.reduce((sum, order) => sum + Number(order.total), 0);
};

export const getSummary = async () => {
  const startOfToday = getStartOfToday();

  const [
    todayOrdersCount,
    paidTodayOrders,
    availableTables,
    occupiedTables,
    totalProducts,
  ] = await Promise.all([
    prisma.order.count({where: {createdAt: {gte: startOfToday}}}),
    prisma.order.findMany({
      where: {
        createdAt: {gte: startOfToday},
        payment: {status: "PAID"},
      },
      select: {total: true},
    }),
    prisma.table.count({where: {status: "AVAILABLE"}}),
    prisma.table.count({where: {status: "OCCUPIED"}}),
    prisma.product.count(),
  ]);

  return {
    todayRevenue: sumPaidOrders(paidTodayOrders),
    todayOrders: todayOrdersCount,
    availableTables,
    occupiedTables,
    totalProducts,
  };
};

export const getSalesChart = async (days: number = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {gte: startDate},
      payment: {status: "PAID"},
    },
    select: {total: true, createdAt: true},
  });

  const salesByDate: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    salesByDate[date.toISOString().slice(0, 10)] = 0;
  }

  orders.forEach((order: {total: unknown; createdAt: Date}) => {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (salesByDate[key] !== undefined) {
      salesByDate[key] += Number(order.total);
    }
  });

  return Object.entries(salesByDate).map(([date, revenue]) => ({
    date,
    revenue,
  }));
};

export const getTopProducts = async (limit: number = 5) => {
  const topItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: {quantity: true},
    orderBy: {_sum: {quantity: "desc"}},
    take: limit,
  });

  const productIds = topItems.map(
    (item: {productId: string}) => item.productId,
  );
  const products = await prisma.product.findMany({
    where: {id: {in: productIds}},
    select: {id: true, name: true},
  });

  return topItems.map(
    (item: {productId: string; _sum: {quantity: number | null}}) => {
      const product = products.find(
        (p: {id: string}) => p.id === item.productId,
      );

      return {
        productId: item.productId,
        name: product?.name ?? "Unknown",
        totalSold: item._sum.quantity ?? 0,
      };
    },
  );
};

export const getRecentOrders = async (limit: number = 10) => {
  return prisma.order.findMany({
    take: limit,
    orderBy: {createdAt: "desc"},
    include: {
      table: {select: {tableNumber: true}},
      payment: {select: {status: true, method: true}},
    },
  });
};

export const getCashierDashboard = async () => {
  const startOfToday = getStartOfToday();

  const [
    pendingOrders,
    preparingOrders,
    readyOrders,
    todayOrdersCount,
    paidTodayOrders,
    occupiedTables,
  ] = await Promise.all([
    prisma.order.count({where: {status: "PENDING"}}),
    prisma.order.count({where: {status: "PREPARING"}}),
    prisma.order.count({where: {status: "READY"}}),
    prisma.order.count({where: {createdAt: {gte: startOfToday}}}),
    prisma.order.findMany({
      where: {createdAt: {gte: startOfToday}, payment: {status: "PAID"}},
      select: {total: true},
    }),
    prisma.table.count({where: {status: "OCCUPIED"}}),
  ]);

  return {
    pendingOrders,
    preparingOrders,
    readyOrders,
    todayOrders: todayOrdersCount,
    todayRevenue: sumPaidOrders(paidTodayOrders),
    occupiedTables,
  };
};

export const getSalesRecap = async (
  period: "day" | "week" | "month" | "year" = "day",
) => {
  const now = new Date();

  const startDate = new Date(now);

  if (period === "day") {
    startDate.setHours(0, 0, 0, 0);
  }

  if (period === "week") {
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  }

  if (period === "month") {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  const paidOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      payment: {
        status: "PAID",
      },
    },
    select: {
      total: true,
    },
  });

  return {
    period,
    totalOrders: paidOrders.length,
    totalRevenue: sumPaidOrders(paidOrders),
  };
};

export const getSalesReportData = async (startDate: Date, endDate: Date) => {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {gte: startDate, lte: endDate},
      payment: {status: "PAID"},
    },
    include: {
      table: {select: {tableNumber: true}},
      payment: {select: {method: true, paidAt: true}},
      items: {include: {product: {select: {name: true}}}},
    },
    orderBy: {createdAt: "asc"},
  });

  const totalRevenue = orders.reduce(
    (sum: number, order: {total: unknown}) => sum + Number(order.total),
    0,
  );

  return {
    startDate,
    endDate,
    orders,
    summary: {
      totalOrders: orders.length,
      totalRevenue,
    },
  };
};
