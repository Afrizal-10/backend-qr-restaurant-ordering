import {ApiError} from "../middlewares/errorMiddleware";

export const parseId = (rawId: string): string => {
  const id = rawId.trim();

  if (!id) {
    throw new ApiError(400, "ID tidak valid");
  }

  return id;
};
