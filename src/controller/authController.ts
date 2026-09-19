import {Response, NextFunction} from "express";
import {Request} from "express";
import * as authService from "../services/authService";
import {AuthRequest} from "../middlewares/authMiddleware";

// Login user dan mengembalikan JWT token
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Mengambil data user yang sedang login (dari JWT token)
export const me = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await authService.getMe(req.user!.userId);

    res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
