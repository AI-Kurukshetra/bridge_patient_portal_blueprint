import { describe, expect, it } from "vitest";
import { canRoleAccessPatientRecord } from "@/lib/auth/patient-access";

describe("canRoleAccessPatientRecord", () => {
  it("allows admin to access any chart", () => {
    expect(canRoleAccessPatientRecord("admin", false)).toBe(true);
  });

  it("allows patient to access only their own chart", () => {
    expect(canRoleAccessPatientRecord("patient", true)).toBe(true);
    expect(canRoleAccessPatientRecord("patient", false)).toBe(false);
  });

  it("allows provider with a care relationship", () => {
    expect(canRoleAccessPatientRecord("provider", false, {
      isPrimaryProvider: false,
      hasAppointment: true,
      hasClinicalRelationship: false,
    })).toBe(true);
  });

  it("blocks provider without a care relationship", () => {
    expect(canRoleAccessPatientRecord("provider", false, {
      isPrimaryProvider: false,
      hasAppointment: false,
      hasClinicalRelationship: false,
    })).toBe(false);
  });
});