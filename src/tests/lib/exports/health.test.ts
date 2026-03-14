import { describe, expect, it } from "vitest";
import {
  buildHealthExportCsv,
  buildHealthExportFhirBundle,
  buildHealthExportPdf,
} from "@/lib/exports/health";
import type { PortalData } from "@/lib/queries/portal";
import type { HealthDataExportInput } from "@/lib/validations/export";

const portalData: PortalData = {
  profile: {
    avatar_url: null,
    created_at: "2026-03-10T08:00:00Z",
    date_of_birth: "1990-05-01",
    email: "jane@example.com",
    full_name: "Jane Patient",
    gender: "female",
    id: "profile-1",
    is_mfa_enabled: true,
    phone: "+15550000",
    preferred_lang: "English",
    role: "patient",
    timezone: "America/Chicago",
    updated_at: "2026-03-14T08:00:00Z",
  },
  patient: {
    advance_directive: true,
    blood_type: "O+",
    created_at: "2026-03-10T08:00:00Z",
    emergency_contact_name: "Avery Patient",
    emergency_contact_phone: "+15551111",
    emergency_contact_rel: "Spouse",
    height_cm: 168,
    id: "patient-1",
    insurance_group_no: "GRP-55",
    insurance_policy_no: "POL-100",
    insurance_provider: "Blue Shield",
    insurance_valid_until: "2027-12-31",
    organ_donor: true,
    patient_mrn: "MRN-1001",
    preferred_pharmacy: "Main Street Pharmacy",
    primary_provider_id: "provider-1",
    profile_id: "profile-1",
    updated_at: "2026-03-14T08:00:00Z",
    weight_kg: 62,
  },
  providers: [
    {
      accepting_patients: true,
      bio: null,
      city: "Austin",
      department: null,
      email: "nina@example.com",
      first_name: "Nina",
      id: "provider-1",
      languages: ["en"],
      last_name: "Shah",
      organization: "Bridge Health",
      phone: "+15552222",
      profile_id: "profile-2",
      specialty: "Cardiology",
      state: "TX",
      sub_specialty: null,
    },
  ],
  appointments: [
    {
      appointment_type: "follow_up",
      cancelled_at: null,
      duration_minutes: 30,
      id: "appt-1",
      location: "Clinic 2",
      meeting_url: null,
      notes: "Bring medication list",
      patient_id: "patient-1",
      provider_id: "provider-1",
      reason: "Cardiology follow-up",
      scheduled_at: "2026-04-10T14:00:00Z",
      status: "confirmed",
    },
  ],
  conditions: [
    {
      clinical_status: "active",
      display_name: "Hypertension",
      fhir_id: "cond-1",
      icd10_code: "I10",
      id: "condition-1",
      notes: "Monitor blood pressure weekly",
      onset_date: "2024-01-15",
      patient_id: "patient-1",
      provider_id: "provider-1",
      resolved_date: null,
      severity: "moderate",
    },
  ],
  allergies: [
    {
      allergen: "Penicillin",
      allergen_type: "medication",
      id: "allergy-1",
      notes: "Documented rash",
      onset_date: "2018-04-01",
      patient_id: "patient-1",
      reaction: ["Rash"],
      severity: "high",
      status: "active",
    },
  ],
  procedures: [
    {
      category: "vaccination",
      id: "procedure-1",
      notes: "Annual influenza vaccine",
      outcome: "completed",
      patient_id: "patient-1",
      performed_at: "2025-10-12T10:30:00Z",
      procedure_name: "Influenza vaccine",
      provider_id: "provider-1",
    },
  ],
  labResults: [
    {
      abnormal_flag: "high",
      fhir_id: "obs-1",
      id: "lab-1",
      observed_at: "2026-03-08T09:00:00Z",
      panel_name: "Lipid panel",
      patient_id: "patient-1",
      provider_id: "provider-1",
      reference_range: "0-199",
      result_text: null,
      result_value: 215,
      status: "final",
      test_name: "Total cholesterol",
      unit: "mg/dL",
    },
  ],
  prescriptions: [
    {
      dosage: "10 mg",
      expires_on: "2026-09-01",
      frequency: "Once daily",
      id: "rx-1",
      instructions: "Take with water",
      last_refill_requested_at: null,
      medication_name: "Lisinopril",
      patient_id: "patient-1",
      pharmacy_name: "Main Street Pharmacy",
      prescribed_on: "2026-03-01",
      provider_id: "provider-1",
      refill_remaining: 2,
      route: "oral",
      status: "active",
    },
  ],
  conversations: [],
  documents: [
    {
      category: "insurance",
      created_at: "2026-03-09T07:00:00Z",
      file_size: 2048,
      id: "doc-1",
      mime_type: "application/pdf",
      patient_id: "patient-1",
      signedUrl: "https://example.com/doc-1",
      storage_path: "patient-1/doc-1.pdf",
      title: "Insurance card",
      uploaded_by: "profile-1",
    },
  ],
  invoices: [],
  payments: [],
  notifications: [],
  consents: [
    {
      consent_type: "research_data_sharing",
      granted: true,
      granted_at: "2026-03-01T08:00:00Z",
      id: "consent-1",
      profile_id: "profile-1",
      revoked_at: null,
      updated_at: "2026-03-01T08:00:00Z",
    },
  ],
  recentActivities: [],
};

const selection: HealthDataExportInput = {
  format: "pdf",
  includeProfile: true,
  includeAppointments: true,
  includeClinicalHistory: true,
  includeLabResults: true,
  includeMedications: true,
  includeDocuments: true,
  includeConsents: true,
};

describe("health export builders", () => {
  it("creates a CSV export with patient timeline rows", () => {
    const csv = buildHealthExportCsv(portalData, selection);

    expect(csv).toContain("section,date,title,status,details,provider,reference_id");
    expect(csv).toContain("Cardiology follow-up");
    expect(csv).toContain("Lisinopril");
    expect(csv).toContain("Insurance card");
  });

  it("creates a FHIR bundle with selected resources", () => {
    const bundle = buildHealthExportFhirBundle(portalData, selection);
    const resourceTypes = (bundle.entry ?? []).map((entry) => (entry.resource as { resourceType?: string }).resourceType);

    expect(bundle.resourceType).toBe("Bundle");
    expect(resourceTypes).toContain("Patient");
    expect(resourceTypes).toContain("Coverage");
    expect(resourceTypes).toContain("Observation");
    expect(resourceTypes).toContain("MedicationRequest");
    expect(resourceTypes).toContain("DocumentReference");
    expect(resourceTypes).toContain("Practitioner");
  });

  it("creates a PDF export document", () => {
    const pdf = buildHealthExportPdf(portalData, selection);
    const header = Buffer.from(pdf).toString("ascii", 0, 8);

    expect(header).toBe("%PDF-1.4");
  });
});