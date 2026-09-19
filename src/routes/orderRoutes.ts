import {Router} from "express";
import * as orderController from "../controller/orderController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";
import {validate} from "../middlewares/validationMiddleware";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/orderValidator";

const orderRouter = Router();

// Public
orderRouter.post("/", validate(createOrderSchema), orderController.createOrder);

// Admin dan Cashier
orderRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  orderController.getOrders,
);
orderRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  orderController.getOrderById,
);
orderRouter.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);
orderRouter.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  orderController.cancelOrder,
);
orderRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.deleteOrder,
);

export default orderRouter;
