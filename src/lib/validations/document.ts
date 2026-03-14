import { z } from "zod";

export const documentSchema = z.object({
  title: z.string().min(2, "Title is required").max(100),
  category: z.enum(["insurance", "discharge_summary", "lab_report", "imaging", "consent", "billing", "other"]),
  storagePath: z.string().min(1, "A file upload is required"),
  mimeType: z.string().max(100).optional().or(z.literal("")),
  fileSize: z.number().min(0).max(10_000_000).optional(),
});

export const documentUploadSchema = z.object({
  title: documentSchema.shape.title,
  category: documentSchema.shape.category,
  file: z
    .custom<File>(
      (value) => (typeof File === "undefined" ? true : value instanceof File),
      "A file upload is required",
    )
    .refine((value) => value.size <= 10_000_000, "File must be 10MB or smaller"),
});

export type DocumentInput = z.infer<typeof documentSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
