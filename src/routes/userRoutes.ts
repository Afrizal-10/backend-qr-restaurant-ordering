import {Router} from "express";
import * as userController from "../controller/userController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";
import {validate} from "../middlewares/validationMiddleware";
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "../validators/userValidator";

const userRouter = Router();

// Admin
userRouter.use(authMiddleware, roleMiddleware("ADMIN"));

userRouter.get("/", userController.getUsers);
userRouter.get("/:id", userController.getUserById);
userRouter.post("/", validate(createUserSchema), userController.createUser);
userRouter.put("/:id", validate(updateUserSchema), userController.updateUser);
userRouter.patch(
  "/:id/status",
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);
userRouter.delete("/:id", userController.deleteUser);

export default userRouter;
