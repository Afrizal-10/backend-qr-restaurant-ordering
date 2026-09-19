import multer from "multer";
import {ApiError} from "./errorMiddleware";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: {fileSize: MAX_FILE_SIZE_BYTES},
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new ApiError(422, "Format gambar harus JPEG, PNG, atau WEBP"),
      );
    }

    callback(null, true);
  },
});
