import {z} from "zod";

export const createOrderSchema = z.object({
  qrToken: z.string().min(1, "qrToken wajib diisi"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "productId tidak valid"),
        quantity: z.number().int().positive("Quantity harus lebih dari 0"),
      }),
    )
    .min(1, "Order harus memiliki minimal 1 item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderStatusValue = z.infer<
  typeof updateOrderStatusSchema
>["status"];
