import { z } from "zod";

export const consentSchema = z.object({
  consentType: z.enum(["treatment", "hipaa", "research", "sms", "email"]),
  granted: z.boolean(),
});

export type ConsentInput = z.infer<typeof consentSchema>;

