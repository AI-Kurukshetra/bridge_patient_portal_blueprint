import { z } from "zod";

export const appointmentSchema = z.object({
  providerId: z.string().uuid("Choose a provider"),
  appointmentType: z.enum(["in_person", "telehealth", "lab", "imaging", "follow_up", "annual"]),
  scheduledAt: z.string().min(1, "Choose a date and time"),
  durationMinutes: z.number().min(15).max(120),
  reason: z.string().min(5, "Reason is required").max(160),
  notes: z.string().max(400).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

