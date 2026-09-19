import crypto from "crypto";

export const generateQrToken = (): string => {
  return crypto.randomBytes(8).toString("base64url");
};
