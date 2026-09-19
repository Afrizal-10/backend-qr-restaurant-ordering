import {Response, NextFunction} from "express";
import * as aiService from "../services/aiService";
import {AuthRequest} from "../middlewares/authMiddleware";

export const chat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = req.user!.role;
    const reply = await aiService.chat(req.body.message, role);

    res.status(200).json({
      success: true,
      message: "AI berhasil menjawab",
      data: {reply},
    });
  } catch (error) {
    next(error);
  }
};
