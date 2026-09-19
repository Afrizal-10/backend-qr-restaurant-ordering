import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import {env} from "../config/env";
import {ApiError} from "./errorMiddleware";

// Payload yang disimpan di dalam JWT
export interface JwtPayload {
  userId: string;
  role: "ADMIN" | "CASHIER";
}

// Request yang sudah lolos authMiddleware akan punya req.user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Token tidak ditemukan"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    next(new ApiError(401, "Token tidak valid atau sudah kedaluwarsa"));
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
      req.user = payload;
    } catch (error) {
      console.error(error);
    }
  }

  next();
};
