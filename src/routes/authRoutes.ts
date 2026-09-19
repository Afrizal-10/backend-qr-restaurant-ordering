import {Router} from "express";
import * as authController from "../controller/authController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {validate} from "../middlewares/validationMiddleware";
import {loginSchema} from "../validators/authValidator";

const authRouter = Router();

authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.get("/me", authMiddleware, authController.me);

export default authRouter;
