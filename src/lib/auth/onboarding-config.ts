import type { AppRole } from "@/lib/auth/roles";

export const registrationRoleOptions: { value: AppRole; label: string; description: string }[] = [
  {
    value: "patient",
    label: "Patient",
    description: "Self-service portal access for visits, labs, billing, prescriptions, and documents.",
  },
  {
    value: "provider",
    label: "Provider",
    description: "Clinical care-team workspace with patient chart access, schedule management, and messaging.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Administrative console for platform oversight, compliance, and operational monitoring.",
  },
];

export function isStaffRole(role: AppRole) {
  return role === "provider" || role === "admin";
}