import { z } from "zod";

export const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  subject: z.string().min(3, "Subject is required").max(120),
  category: z.enum(["general", "care_plan", "billing", "prescription", "lab_result", "appointment"]),
  body: z.string().min(5, "Message is required").max(2000),
});

export type MessageInput = z.infer<typeof messageSchema>;

