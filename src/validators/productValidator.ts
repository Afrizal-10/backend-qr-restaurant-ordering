import {z} from "zod";

const booleanField = z.preprocess((value) => {
  if (typeof value === "string") {
    return value === "true";
  }
  return value;
}, z.boolean());

export const createProductSchema = z.object({
  categoryId: z.coerce.string().min(1, "categoryId tidak valid"),
  name: z.string().min(1, "Nama product wajib diisi"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Harga harus lebih dari 0"),
  image: z.string().optional(),
  isAvailable: booleanField.optional(),
});

export const updateProductSchema = createProductSchema;

export const updateAvailabilitySchema = z.object({
  isAvailable: booleanField,
});

export type ProductInput = z.infer<typeof createProductSchema>;
