import { describe, expect, it } from "vitest";
import { appointmentSchema } from "@/lib/validations/appointment";

describe("appointment validation", () => {
  it("accepts a valid appointment", () => {
    expect(appointmentSchema.safeParse({ providerId: "550e8400-e29b-41d4-a716-446655440000", appointmentType: "follow_up", scheduledAt: "2026-03-20T09:30", durationMinutes: 30, reason: "Discuss recent symptoms", notes: "", location: "" }).success).toBe(true);
  });

  it("rejects a short reason", () => {
    expect(appointmentSchema.safeParse({ providerId: "550e8400-e29b-41d4-a716-446655440000", appointmentType: "follow_up", scheduledAt: "2026-03-20T09:30", durationMinutes: 30, reason: "bad", notes: "", location: "" }).success).toBe(false);
  });
});

