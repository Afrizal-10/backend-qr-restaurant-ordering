import {Router} from "express";
import * as paymentController from "../controller/paymentController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";

const paymentRouter = Router();

// Public
paymentRouter.post("/:orderId/qris", paymentController.createQrisPayment);
paymentRouter.get("/:orderId/status", paymentController.checkQrisPaymentStatus);

// Admin dan Cashier
paymentRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  paymentController.getPaymentById,
);
paymentRouter.patch(
  "/:id/confirm",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  paymentController.confirmCashPayment,
);

export default paymentRouter;
