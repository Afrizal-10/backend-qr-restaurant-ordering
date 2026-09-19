import {Response, NextFunction} from "express";
import {AuthRequest} from "./authMiddleware";
import {ApiError} from "./errorMiddleware";

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Anda belum login"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Anda tidak memiliki akses"));
    }

    next();
  };
};
