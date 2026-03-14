import { z } from "zod";

export const documentSchema = z.object({
  title: z.string().min(2, "Title is required").max(100),
  category: z.enum(["insurance", "discharge_summary", "lab_report", "imaging", "consent", "billing", "other"]),
  mimeType: z.string().max(100).optional().or(z.literal("")),
  fileSize: z.number().min(0).max(10_000_000).optional(),
});

export type DocumentInput = z.infer<typeof documentSchema>;

