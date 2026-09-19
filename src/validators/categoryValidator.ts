import {z} from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema;

export type CategoryInput = z.infer<typeof createCategorySchema>;
