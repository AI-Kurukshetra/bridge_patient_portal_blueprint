import type { AppRole } from "@/lib/auth/roles";

export type ProviderPatientAccessSignals = {
  isPrimaryProvider: boolean;
  hasAppointment: boolean;
  hasClinicalRelationship: boolean;
};

export function canRoleAccessPatientRecord(role: AppRole, isOwner: boolean, signals?: ProviderPatientAccessSignals) {
  if (role === "admin") {
    return true;
  }

  if (role === "patient") {
    return isOwner;
  }

  if (!signals) {
    return false;
  }

  return signals.isPrimaryProvider || signals.hasAppointment || signals.hasClinicalRelationship;
}