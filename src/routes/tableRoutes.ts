import {Router} from "express";
import * as tableController from "../controller/tableController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";
import {validate} from "../middlewares/validationMiddleware";
import {
  createTableSchema,
  updateTableSchema,
} from "../validators/tableValidator";

const tableRouter: Router = Router();

// Public
tableRouter.get("/qr/:qrToken", tableController.getTableByQrToken);

// Admin dan Cashier
tableRouter.get("/", authMiddleware, tableController.getTables);
tableRouter.get("/:id", authMiddleware, tableController.getTableById);

// Admin
tableRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(createTableSchema),
  tableController.createTable,
);
tableRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(updateTableSchema),
  tableController.updateTable,
);
tableRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  tableController.deleteTable,
);
tableRouter.post(
  "/:id/generate-qr",
  authMiddleware,
  roleMiddleware("ADMIN"),
  tableController.regenerateQr,
);
tableRouter.post(
  "/:id/regenerate-qr",
  authMiddleware,
  roleMiddleware("ADMIN"),
  tableController.regenerateQr,
);

export default tableRouter;
