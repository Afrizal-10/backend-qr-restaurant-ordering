import {Request, Response, NextFunction} from "express";
import * as paymentService from "../services/paymentService";
import {ApiError} from "../middlewares/errorMiddleware";

const parseId = (rawId: string) => {
  if (!rawId || rawId.trim() === "") {
    throw new ApiError(400, "ID tidak valid");
  }

  return rawId;
};

// Create QRIS payment untuk order tertentu
export const createQrisPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = parseId(req.params.orderId);
    const result = await paymentService.createQrisPayment(orderId);

    res.status(200).json({
      success: true,
      message: "QRIS berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Check status QRIS payment untuk order tertentu
export const checkQrisPaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = parseId(req.params.orderId);
    const payment = await paymentService.checkQrisPaymentStatus(orderId);

    res.status(200).json({
      success: true,
      message: "Status payment berhasil diambil",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// Confirm cash payment untuk order tertentu
export const confirmCashPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const payment = await paymentService.confirmCashPayment(id);

    res.status(200).json({
      success: true,
      message: "Payment cash berhasil dikonfirmasi",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// Get payment by ID
export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const payment = await paymentService.getPaymentById(id);

    res.status(200).json({
      success: true,
      message: "Detail payment berhasil diambil",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
