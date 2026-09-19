import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

  jwtSecret: process.env.JWT_SECRET || "restoku-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",

  midtransServerKey: process.env.MIDTRANS_SERVER_KEY || "",
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || "",
  midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",

  geminiApiKey: process.env.GEMINI_API_KEY || "",
};
