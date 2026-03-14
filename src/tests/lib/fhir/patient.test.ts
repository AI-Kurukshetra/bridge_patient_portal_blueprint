import { describe, expect, it } from "vitest";
import { buildFhirPatient } from "@/lib/fhir/patient";

describe("buildFhirPatient", () => {
  it("maps profile and patient rows to a FHIR Patient resource", () => {
    const resource = buildFhirPatient(
      {
        avatar_url: null,
        created_at: "2026-03-14T00:00:00Z",
        date_of_birth: "1990-04-01",
        email: "patient@example.com",
        full_name: "Jane Patient",
        gender: "female",
        id: "profile-1",
        is_mfa_enabled: false,
        phone: "+15550100",
        preferred_lang: "en",
        role: "patient",
        timezone: "UTC",
        updated_at: "2026-03-14T00:00:00Z",
      },
      {
        advance_directive: false,
        blood_type: "O+",
        created_at: "2026-03-14T00:00:00Z",
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_rel: null,
        height_cm: null,
        id: "patient-1",
        insurance_group_no: null,
        insurance_policy_no: null,
        insurance_provider: null,
        insurance_valid_until: null,
        organ_donor: false,
        patient_mrn: "MRN-1001",
        preferred_pharmacy: null,
        primary_provider_id: "provider-1",
        profile_id: "profile-1",
        updated_at: "2026-03-14T00:00:00Z",
        weight_kg: null,
      },
    );

    expect(resource.resourceType).toBe("Patient");
    expect(resource.id).toBe("patient-1");
    expect(resource.identifier[0]?.value).toBe("MRN-1001");
    expect(resource.name[0]?.text).toBe("Jane Patient");
    expect(resource.generalPractitioner[0]?.reference).toBe("Practitioner/provider-1");
  });
});
