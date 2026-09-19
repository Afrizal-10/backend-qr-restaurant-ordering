import {Response, NextFunction} from "express";
import {Request} from "express";
import * as orderService from "../services/orderService";
import {AuthRequest} from "../middlewares/authMiddleware";
import {ApiError} from "../middlewares/errorMiddleware";

const parseId = (rawId: string) => {
  if (!rawId || rawId.trim() === "") {
    throw new ApiError(400, "ID tidak valid");
  }

  return rawId;
};

// Create order baru
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const order = await orderService.createOrder(req.body);

    res.status(201).json({
      success: true,
      message: "Order berhasil dibuat",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get semua order
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orders = await orderService.getOrders();

    res.status(200).json({
      success: true,
      message: "Daftar order berhasil diambil",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Get order by ID
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const order = await orderService.getOrderById(id);

    res.status(200).json({
      success: true,
      message: "Detail order berhasil diambil",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Update status order (misal: PENDING, PAID atau CANCELLED)
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const changedBy = req.user!.role;
    const order = await orderService.updateOrderStatus(
      id,
      req.body.status,
      changedBy,
    );

    res.status(200).json({
      success: true,
      message: "Status order berhasil diperbarui",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const changedBy = req.user!.role;
    const order = await orderService.cancelOrder(id, changedBy);

    res.status(200).json({
      success: true,
      message: "Order berhasil dibatalkan",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Delete order
export const deleteOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    await orderService.deleteOrder(id);

    res.status(200).json({
      success: true,
      message: "Order berhasil dihapus",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
