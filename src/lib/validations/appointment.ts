import { z } from "zod";

const scheduledAtSchema = z
  .string()
  .min(1, "Choose a date and time")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Choose a valid date and time")
  .refine((value) => new Date(value).getTime() > Date.now(), "Appointment time must be in the future");

const durationSchema = z
  .number()
  .int("Duration must be in whole minutes")
  .min(15, "Minimum duration is 15 minutes")
  .max(120, "Maximum duration is 120 minutes");

const textField = (maxLength: number) => z.string().trim().max(maxLength).optional().or(z.literal(""));

export const appointmentSchema = z.object({
  providerId: z.string().uuid("Choose a provider"),
  appointmentType: z.enum(["in_person", "telehealth", "lab", "imaging", "follow_up", "annual"]),
  scheduledAt: scheduledAtSchema,
  durationMinutes: durationSchema,
  reason: z.string().trim().min(5, "Reason is required").max(160, "Reason must be under 160 characters"),
  notes: textField(400),
  location: textField(120),
});

export const appointmentRescheduleSchema = z.object({
  scheduledAt: scheduledAtSchema,
  durationMinutes: durationSchema,
  notes: textField(400),
  location: textField(120),
});

export const providerAppointmentStatusSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled"]),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentRescheduleInput = z.infer<typeof appointmentRescheduleSchema>;
export type ProviderAppointmentStatusInput = z.infer<typeof providerAppointmentStatusSchema>;