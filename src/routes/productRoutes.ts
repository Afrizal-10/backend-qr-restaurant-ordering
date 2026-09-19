import {Router} from "express";
import * as productController from "../controller/productController";
import {authMiddleware, optionalAuth} from "../middlewares/authMiddleware";
import {roleMiddleware} from "../middlewares/roleMiddleware";
import {validate} from "../middlewares/validationMiddleware";
import {uploadImage} from "../middlewares/uploadMiddleware";
import {
  createProductSchema,
  updateProductSchema,
  updateAvailabilitySchema,
} from "../validators/productValidator";

const router = Router();

// Public
router.get("/", optionalAuth, productController.getProducts);
router.get("/:id", optionalAuth, productController.getProductById);

// Admin
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  uploadImage.single("image"),
  validate(createProductSchema),
  productController.createProduct,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  uploadImage.single("image"),
  validate(updateProductSchema),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  productController.deleteProduct,
);
router.patch(
  "/:id/availability",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(updateAvailabilitySchema),
  productController.updateAvailability,
);

router.post(
  "/upload-image",
  authMiddleware,
  roleMiddleware("ADMIN"),
  uploadImage.single("image"),
  productController.uploadImage,
);

export default router;
