import prisma from "../config/prisma";
import {ApiError} from "../middlewares/errorMiddleware";
import {generateQrToken} from "../utils/generateQrToken";
import {TableInput} from "../validators/tableValidator";

export const createTable = async (data: TableInput) => {
  return prisma.table.create({
    data: {
      ...data,
      qrToken: generateQrToken(),
    },
  });
};

export const getTables = async () => {
  return prisma.table.findMany({
    orderBy: {tableNumber: "asc"},
  });
};

export const getTableById = async (id: string) => {
  const table = await prisma.table.findUnique({where: {id}});

  if (!table) {
    throw new ApiError(404, "Meja tidak ditemukan");
  }

  return table;
};

export const updateTable = async (id: string, data: TableInput) => {
  const table = await prisma.table.findUnique({where: {id}});

  if (!table) {
    throw new ApiError(404, "Meja tidak ditemukan");
  }

  return prisma.table.update({where: {id}, data});
};

export const deleteTable = async (id: string) => {
  const table = await prisma.table.findUnique({
    where: {id},
    include: {orders: true},
  });

  if (!table) {
    throw new ApiError(404, "Meja tidak ditemukan");
  }

  if (table.orders.length > 0) {
    throw new ApiError(
      409,
      "Meja tidak dapat dihapus karena masih memiliki riwayat order",
    );
  }

  await prisma.table.delete({where: {id}});
};

export const regenerateQrToken = async (id: string) => {
  const table = await prisma.table.findUnique({where: {id}});

  if (!table) {
    throw new ApiError(404, "Meja tidak ditemukan");
  }

  return prisma.table.update({
    where: {id},
    data: {qrToken: generateQrToken()},
  });
};

export const getTableByQrToken = async (qrToken: string) => {
  const table = await prisma.table.findUnique({where: {qrToken}});

  if (!table) {
    throw new ApiError(404, "QR tidak valid atau meja tidak ditemukan");
  }

  return table;
};
