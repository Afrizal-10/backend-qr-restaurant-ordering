import {Response, NextFunction} from "express";
import * as userService from "../services/userService";
import {AuthRequest} from "../middlewares/authMiddleware";
import {parseId} from "../utils/parseId";

// Create user baru
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get semua user
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await userService.getUsers();

    res.status(200).json({
      success: true,
      message: "Daftar user berhasil diambil",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      message: "Detail user berhasil diambil",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user by ID
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const user = await userService.updateUser(id, req.body);

    res.status(200).json({
      success: true,
      message: "User berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update status user by ID
export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    const user = await userService.updateUserStatus(
      id,
      req.body.status,
      req.user!.userId,
    );

    res.status(200).json({
      success: true,
      message: "Status user berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user by ID
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    await userService.deleteUser(id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: "User berhasil dihapus",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
