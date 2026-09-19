import {Router} from "express";
import * as aiController from "../controller/aiController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";
import {validate} from "../middlewares/validationMiddleware";
import {chatSchema} from "../validators/aiValidator";

const aiRouter = Router();

aiRouter.post(
  "/chat",
  authMiddleware,
  roleMiddleware("ADMIN", "CASHIER"),
  validate(chatSchema),
  aiController.chat,
);

export default aiRouter;
