import { Response } from "express";

export const successResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
