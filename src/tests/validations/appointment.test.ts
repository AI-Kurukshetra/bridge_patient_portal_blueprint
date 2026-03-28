import { describe, expect, it } from "vitest";
import {
  appointmentRescheduleSchema,
  appointmentSchema,
  providerAppointmentStatusSchema,
} from "@/lib/validations/appointment";

function futureDate(hoursFromNow = 24) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function pastDate(hoursAgo = 24) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

describe("appointment validation", () => {
  it("accepts a valid appointment", () => {
    expect(appointmentSchema.safeParse({ providerId: "550e8400-e29b-41d4-a716-446655440000", appointmentType: "follow_up", scheduledAt: futureDate(), durationMinutes: 30, reason: "Discuss recent symptoms", notes: "", location: "" }).success).toBe(true);
  });

  it("rejects a short reason", () => {
    expect(appointmentSchema.safeParse({ providerId: "550e8400-e29b-41d4-a716-446655440000", appointmentType: "follow_up", scheduledAt: futureDate(), durationMinutes: 30, reason: "bad", notes: "", location: "" }).success).toBe(false);
  });

  it("rejects appointments in the past", () => {
    expect(appointmentSchema.safeParse({ providerId: "550e8400-e29b-41d4-a716-446655440000", appointmentType: "follow_up", scheduledAt: pastDate(), durationMinutes: 30, reason: "Discuss recent symptoms", notes: "", location: "" }).success).toBe(false);
  });

  it("accepts a valid reschedule request", () => {
    expect(appointmentRescheduleSchema.safeParse({ scheduledAt: futureDate(48), durationMinutes: 45, notes: "Move to afternoon", location: "Main clinic" }).success).toBe(true);
  });

  it("accepts valid provider status transitions", () => {
    expect(providerAppointmentStatusSchema.safeParse({ status: "confirmed" }).success).toBe(true);
    expect(providerAppointmentStatusSchema.safeParse({ status: "completed" }).success).toBe(true);
    expect(providerAppointmentStatusSchema.safeParse({ status: "cancelled" }).success).toBe(true);
  });

  it("rejects unknown provider statuses", () => {
    expect(providerAppointmentStatusSchema.safeParse({ status: "rescheduled" }).success).toBe(false);
  });
});