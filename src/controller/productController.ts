import {Response, NextFunction} from "express";
import * as productService from "../services/productService";
import {AuthRequest} from "../middlewares/authMiddleware";
import {ApiError} from "../middlewares/errorMiddleware";

const parseId = (rawId: string) => {
  if (!rawId || rawId.trim() === "") {
    throw new ApiError(400, "ID tidak valid");
  }

  return rawId;
};

// Check jika user adalah ADMIN atau CASHIER
const isStaff = (req: AuthRequest) =>
  req.user?.role === "ADMIN" || req.user?.role === "CASHIER";

// Create product baru
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await productService.createProduct(
      req.body,
      req.file?.buffer,
    );

    res.status(201).json({
      success: true,
      message: "Product berhasil dibuat",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get semua product
export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await productService.getProducts(isStaff(req));

    res.status(200).json({
      success: true,
      message: "Daftar product berhasil diambil",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
export const getProductById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const product = await productService.getProductById(id, isStaff(req));

    res.status(200).json({
      success: true,
      message: "Detail product berhasil diambil",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update product by ID
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const product = await productService.updateProduct(
      id,
      req.body,
      req.file?.buffer,
    );

    res.status(200).json({
      success: true,
      message: "Product berhasil diperbarui",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product by ID
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    await productService.deleteProduct(id);

    res.status(200).json({
      success: true,
      message: "Product berhasil dihapus",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Update availability product by ID
export const updateAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const product = await productService.updateAvailability(
      id,
      req.body.isAvailable,
    );

    res.status(200).json({
      success: true,
      message: "Status ketersediaan product berhasil diperbarui",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Upload image untuk product
export const uploadImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      throw new ApiError(422, "File gambar wajib diupload (field: image)");
    }

    const url = await productService.uploadProductImage(req.file.buffer);

    res.status(200).json({
      success: true,
      message: "Gambar berhasil diupload",
      data: {url},
    });
  } catch (error) {
    next(error);
  }
};
