import {Request, Response, NextFunction} from "express";
import {ZodSchema} from "zod";
import {ApiError} from "./errorMiddleware";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return next(new ApiError(422, firstError.message));
    }

    req.body = result.data;
    next();
  };
};
