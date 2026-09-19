import {Router} from "express";
import * as categoryController from "../controller/categoryController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";
import {validate} from "../middlewares/validationMiddleware";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/categoryValidator";

const categoryRouter = Router();

// Public
categoryRouter.get("/", categoryController.getCategories);
categoryRouter.get("/:id", categoryController.getCategoryById);

// Admin
categoryRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(createCategorySchema),
  categoryController.createCategory,
);
categoryRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);
categoryRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  categoryController.deleteCategory,
);

export default categoryRouter;
