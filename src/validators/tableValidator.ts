import {z} from "zod";

export const createTableSchema = z.object({
  tableNumber: z.string().min(1, "Nomor meja wajib diisi"),
  capacity: z.number().int().positive("Kapasitas harus lebih dari 0"),
});

export const updateTableSchema = createTableSchema;

export type TableInput = z.infer<typeof createTableSchema>;
