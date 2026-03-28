import { describe, expect, it } from "vitest";
import { getDefaultRouteForRole, normalizeRole } from "@/lib/auth/roles";

describe("rbac roles", () => {
  it("defaults unknown roles to patient", () => {
    expect(normalizeRole("caregiver")).toBe("patient");
  });

  it("maps provider and admin roles to their default routes", () => {
    expect(getDefaultRouteForRole("provider")).toBe("/care-team");
    expect(getDefaultRouteForRole("admin")).toBe("/admin");
  });
});
