import type { Row } from "@/types/database";

export function buildFhirPatient(profile: Row<"profiles">, patient: Row<"patients">) {
  return {
    resourceType: "Patient",
    id: patient.id,
    identifier: [{ system: "https://medconnect.app/mrn", value: patient.patient_mrn }],
    name: [{ use: "official", text: profile.full_name }],
    telecom: [
      { system: "email", value: profile.email },
      ...(profile.phone ? [{ system: "phone", value: profile.phone }] : []),
    ],
    gender: profile.gender ?? "unknown",
    birthDate: profile.date_of_birth,
    generalPractitioner: patient.primary_provider_id
      ? [{ reference: `Practitioner/${patient.primary_provider_id}` }]
      : [],
  };
}
