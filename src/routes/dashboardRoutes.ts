import {Router} from "express";
import * as dashboardController from "../controller/dashboardController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";
import router from "./productRoutes";

const dashboardRouter = Router();

// Admin
dashboardRouter.get(
  "/summary",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getSummary,
);
dashboardRouter.get(
  "/sales",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getSales,
);
dashboardRouter.get(
  "/top-products",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getTopProducts,
);
dashboardRouter.get(
  "/orders",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getOrders,
);
dashboardRouter.get(
  "/orders",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getOrders,
);
dashboardRouter.get(
  "/export/excel",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.exportExcel,
);
dashboardRouter.get(
  "/export/pdf",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.exportPdf,
);

dashboardRouter.get(
  "/cashier",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  dashboardController.getCashierDashboard,
);

export default dashboardRouter;
