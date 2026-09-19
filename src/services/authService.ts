import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {env} from "../config/env";
import {ApiError} from "../middlewares/errorMiddleware";
import {LoginInput} from "../validators/authValidator";
import prisma from "../config/prisma";

const toSafeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
});

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {email: input.email},
  });

  if (!user) {
    throw new ApiError(401, "Email atau password salah");
  }

  if (user.status === "INACTIVE") {
    throw new ApiError(403, "Akun Anda tidak aktif, hubungi admin");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Email atau password salah");
  }

  const token = jwt.sign({userId: user.id, role: user.role}, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);

  return {
    token,
    user: toSafeUser(user),
  };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {id: userId},
  });

  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }

  return toSafeUser(user);
};
