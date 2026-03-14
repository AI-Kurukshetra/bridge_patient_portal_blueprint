import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/validations/profile";

describe("profile validation", () => {
  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse({ fullName: "Jane Patient", phone: "", dateOfBirth: "", gender: "female", bloodType: "O+", heightCm: 172, weightKg: 74, emergencyContactName: "Anita", emergencyContactPhone: "5550100", emergencyContactRel: "Spouse", preferredPharmacy: "WellCare", insuranceProvider: "BlueCross", insurancePolicyNo: "123", insuranceGroupNo: "ABC", insuranceValidUntil: "2026-10-01", preferredLang: "en", timezone: "UTC", isMfaEnabled: true, advanceDirective: true, organDonor: false }).success).toBe(true);
  });

  it("rejects an invalid height", () => {
    expect(profileSchema.safeParse({ fullName: "Jane Patient", phone: "", dateOfBirth: "", gender: "female", bloodType: "O+", heightCm: 10, weightKg: 74, emergencyContactName: "Anita", emergencyContactPhone: "5550100", emergencyContactRel: "Spouse", preferredPharmacy: "WellCare", insuranceProvider: "BlueCross", insurancePolicyNo: "123", insuranceGroupNo: "ABC", insuranceValidUntil: "2026-10-01", preferredLang: "en", timezone: "UTC", isMfaEnabled: true, advanceDirective: true, organDonor: false }).success).toBe(false);
  });
});

