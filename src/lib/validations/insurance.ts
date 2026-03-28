import { z } from "zod";

export const claimAppealSchema = z.object({
  claimId: z.string().uuid("Claim reference is invalid"),
  appealReason: z.string().trim().min(20, "Explain why this claim should be reviewed").max(500, "Appeal reason must be under 500 characters"),
});

export type ClaimAppealInput = z.infer<typeof claimAppealSchema>;