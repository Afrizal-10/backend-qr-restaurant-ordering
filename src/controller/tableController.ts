import {Request, Response, NextFunction} from "express";
import * as tableService from "../services/tableService";
import {ApiError} from "../middlewares/errorMiddleware";

const parseId = (rawId: string) => {
  if (!rawId || rawId.trim() === "") {
    throw new ApiError(400, "ID tidak valid");
  }

  return rawId;
};

// Create table baru
export const createTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const table = await tableService.createTable(req.body);

    res.status(201).json({
      success: true,
      message: "Meja berhasil dibuat",
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

// Get semua table
export const getTables = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tables = await tableService.getTables();

    res.status(200).json({
      success: true,
      message: "Daftar meja berhasil diambil",
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

// Get table by ID
export const getTableById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const table = await tableService.getTableById(id);

    res.status(200).json({
      success: true,
      message: "Detail meja berhasil diambil",
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

// Update table by ID
export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const table = await tableService.updateTable(id, req.body);

    res.status(200).json({
      success: true,
      message: "Meja berhasil diperbarui",
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    await tableService.deleteTable(id);

    res.status(200).json({
      success: true,
      message: "Meja berhasil dihapus",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Regenerate QR token untuk table tertentu
export const regenerateQr = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const table = await tableService.regenerateQrToken(id);

    res.status(200).json({
      success: true,
      message: "QR meja berhasil dibuat",
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

// Get table by QR token
export const getTableByQrToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {qrToken} = req.params;
    const table = await tableService.getTableByQrToken(qrToken);

    res.status(200).json({
      success: true,
      message: "Meja ditemukan",
      data: table,
    });
  } catch (error) {
    next(error);
  }
};
