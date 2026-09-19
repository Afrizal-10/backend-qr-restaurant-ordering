import bcrypt from "bcryptjs";
import {ApiError} from "../middlewares/errorMiddleware";
import {CreateUserInput, UpdateUserInput} from "../validators/userValidator";
import prisma from "../config/prisma";

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const createUser = async (data: CreateUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {email: data.email},
  });

  if (existingUser) {
    throw new ApiError(409, "Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {...data, password: hashedPassword},
    select: SAFE_USER_SELECT,
  });
};

export const getUsers = async () => {
  return prisma.user.findMany({
    select: SAFE_USER_SELECT,
    orderBy: {createdAt: "desc"},
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {id},
    select: SAFE_USER_SELECT,
  });

  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }

  return user;
};

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const user = await prisma.user.findUnique({where: {id}});

  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }

  if (data.email !== user.email) {
    const emailTaken = await prisma.user.findUnique({
      where: {email: data.email},
    });
    if (emailTaken) {
      throw new ApiError(409, "Email sudah dipakai user lain");
    }
  }

  const updateData: {name: string; email: string; password?: string} = {
    name: data.name,
    email: data.email,
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: {id},
    data: updateData,
    select: SAFE_USER_SELECT,
  });
};

export const updateUserStatus = async (
  id: string,
  status: "ACTIVE" | "INACTIVE",
  requesterId: string,
) => {
  if (id === requesterId) {
    throw new ApiError(422, "Anda tidak bisa menonaktifkan akun Anda sendiri");
  }

  const user = await prisma.user.findUnique({where: {id}});

  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }

  return prisma.user.update({
    where: {id},
    data: {status},
    select: SAFE_USER_SELECT,
  });
};

export const deleteUser = async (id: string, requesterId: string) => {
  if (id === requesterId) {
    throw new ApiError(422, "Anda tidak bisa menghapus akun Anda sendiri");
  }

  const user = await prisma.user.findUnique({
    where: {id},
    include: {orders: true},
  });

  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }

  if (user.orders.length > 0) {
    throw new ApiError(
      409,
      "User ini tidak dapat dihapus karena masih memiliki riwayat order sebagai cashier. Nonaktifkan saja user ini.",
    );
  }

  await prisma.user.delete({where: {id}});
};
