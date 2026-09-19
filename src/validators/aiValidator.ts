import {z} from "zod";

export const chatSchema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong"),
});

export type ChatInput = z.infer<typeof chatSchema>;
