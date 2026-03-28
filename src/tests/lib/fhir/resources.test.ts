import { describe, expect, it } from "vitest";
import { buildFhirCapabilityStatement, buildFhirCoverage, buildFhirEncounter, buildFhirPractitioner } from "@/lib/fhir/resources";

describe("FHIR resource builders", () => {
  it("maps insurance data to Coverage", () => {
    const resource = buildFhirCoverage({
      advance_directive: false,
      blood_type: "O+",
      created_at: "2026-03-14T00:00:00Z",
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_rel: null,
      height_cm: null,
      id: "patient-1",
      insurance_group_no: "GRP-22",
      insurance_policy_no: "POL-99",
      insurance_provider: "Blue Shield",
      insurance_valid_until: "2027-01-31",
      organ_donor: false,
      patient_mrn: "MRN-1001",
      preferred_pharmacy: null,
      primary_provider_id: "provider-1",
      profile_id: "profile-1",
      updated_at: "2026-03-14T00:00:00Z",
      weight_kg: null,
    });

    expect(resource.resourceType).toBe("Coverage");
    expect(resource.payor[0]?.display).toBe("Blue Shield");
    expect(resource.subscriberId).toBe("POL-99");
  });

  it("maps appointments to Encounter", () => {
    const resource = buildFhirEncounter({
      appointment_type: "follow_up",
      cancelled_at: null,
      duration_minutes: 30,
      id: "appt-1",
      location: "Clinic 2",
      meeting_url: null,
      notes: null,
      patient_id: "patient-1",
      provider_id: "provider-1",
      reason: "Post-op review",
      scheduled_at: "2026-03-14T10:00:00Z",
      status: "completed",
    }, "patient-1");

    expect(resource.resourceType).toBe("Encounter");
    expect(resource.status).toBe("finished");
    expect(resource.subject.reference).toBe("Patient/patient-1");
    expect(resource.appointment[0]?.reference).toBe("Appointment/appt-1");
  });

  it("maps providers to Practitioner", () => {
    const resource = buildFhirPractitioner({
      accepting_patients: true,
      bio: null,
      city: "Austin",
      created_at: "2026-03-01T08:00:00Z",
      department: null,
      email: "dr@example.com",
      first_name: "Nina",
      id: "provider-1",
      languages: ["en", "es"],
      last_name: "Shah",
      organization: "MedConnect Health",
      phone: "+15550100",
      profile_id: "profile-2",
      specialty: "Cardiology",
      state: "TX",
      sub_specialty: null,
    });

    expect(resource.resourceType).toBe("Practitioner");
    expect(resource.name[0]?.text).toBe("Nina Shah");
    expect(resource.qualification[0]?.code.text).toBe("Cardiology");
  });

  it("advertises the supported FHIR resources in metadata", () => {
    const statement = buildFhirCapabilityStatement();

    expect(statement.resourceType).toBe("CapabilityStatement");
    expect(statement.rest[0]?.resource.some((resource) => resource.type === "Coverage")).toBe(true);
    expect(statement.rest[0]?.resource.some((resource) => resource.type === "Procedure")).toBe(true);
  });
});