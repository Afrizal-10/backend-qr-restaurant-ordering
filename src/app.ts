import express from "express";
import cors from "cors";
import helmet from "helmet";
import {env} from "./config/env";
import {successResponse} from "./utils/apiResponse";
import {errorMiddleware} from "./middlewares/errorMiddleware";
import authRouter from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import tableRoutes from "./routes/tableRoutes";
import orderRouter from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import aiRoutes from "./routes/aiRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({origin: env.clientUrl}));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

// Health check - untuk memastikan server berjalan
app.get("/api/health", (req, res) => {
  successResponse(res, 200, "Server berjalan dengan baik");
});

app.use(errorMiddleware);

export default app;
