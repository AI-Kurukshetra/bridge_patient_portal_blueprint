import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(80),
  phone: z.string().max(20).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  heightCm: z.number().min(30).max(260).optional(),
  weightKg: z.number().min(2).max(500).optional(),
  emergencyContactName: z.string().max(80).optional().or(z.literal("")),
  emergencyContactPhone: z.string().max(20).optional().or(z.literal("")),
  emergencyContactRel: z.string().max(40).optional().or(z.literal("")),
  preferredPharmacy: z.string().max(80).optional().or(z.literal("")),
  insuranceProvider: z.string().max(80).optional().or(z.literal("")),
  insurancePolicyNo: z.string().max(40).optional().or(z.literal("")),
  insuranceGroupNo: z.string().max(40).optional().or(z.literal("")),
  insuranceValidUntil: z.string().optional().or(z.literal("")),
  preferredLang: z.string().max(10),
  timezone: z.string().max(50),
  advanceDirective: z.boolean(),
  organDonor: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
