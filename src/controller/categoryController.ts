import {Request, Response, NextFunction} from "express";
import * as categoryService from "../services/categoryService";
import {ApiError} from "../middlewares/errorMiddleware";

const parseId = (rawId: string) => {
  if (!rawId || rawId.trim() === "") {
    throw new ApiError(400, "ID tidak valid");
  }

  return rawId;
};

// Create category baru
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: "Category berhasil dibuat",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Get semua category
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await categoryService.getCategories();

    res.status(200).json({
      success: true,
      message: "Daftar category berhasil diambil",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get category by ID
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);

    const category = await categoryService.getCategoryById(id);

    res.status(200).json({
      success: true,
      message: "Detail category berhasil diambil",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Update category by ID
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);

    const category = await categoryService.updateCategory(id, req.body);

    res.status(200).json({
      success: true,
      message: "Category berhasil diperbarui",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Delete category by ID
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);

    await categoryService.deleteCategory(id);

    res.status(200).json({
      success: true,
      message: "Category berhasil dihapus",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
