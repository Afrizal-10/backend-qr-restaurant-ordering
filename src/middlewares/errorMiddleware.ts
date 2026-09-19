import {Request, Response, NextFunction} from "express";
import {MulterError} from "multer";
import {env} from "../config/env";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Ukuran file terlalu besar, maksimal 5MB"
        : "Upload file gagal";

    if (env.nodeEnv === "development") {
      console.error(err);
    }

    return res.status(422).json({success: false, message});
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Terjadi kesalahan pada server";

  if (env.nodeEnv === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
