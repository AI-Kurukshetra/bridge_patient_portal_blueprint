import type { Row } from "@/types/database";

function addMinutes(dateTime: string, minutes: number) {
  const value = new Date(dateTime);
  value.setMinutes(value.getMinutes() + minutes);
  return value.toISOString();
}

function readableText(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : undefined;
}

function encounterStatus(status: string) {
  switch (status) {
    case "scheduled":
    case "confirmed":
      return "planned";
    case "completed":
      return "finished";
    case "cancelled":
      return "cancelled";
    default:
      return "in-progress";
  }
}

function encounterClass(item: Row<"appointments">) {
  if (item.meeting_url) {
    return {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "VR",
      display: "virtual",
    };
  }

  return {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "AMB",
    display: "ambulatory",
  };
}

export function buildFhirCondition(condition: Row<"conditions">, patientId: string) {
  return {
    resourceType: "Condition",
    id: condition.fhir_id ?? condition.id,
    subject: { reference: `Patient/${patientId}` },
    code: {
      text: condition.display_name,
      coding: condition.icd10_code
        ? [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: condition.icd10_code }]
        : [],
    },
    clinicalStatus: { text: condition.clinical_status },
    onsetDateTime: condition.onset_date,
    recordedDate: condition.onset_date ?? condition.resolved_date ?? undefined,
    note: condition.notes ? [{ text: condition.notes }] : undefined,
  };
}

export function buildFhirAllergy(allergy: Row<"allergies">, patientId: string) {
  return {
    resourceType: "AllergyIntolerance",
    id: allergy.id,
    patient: { reference: `Patient/${patientId}` },
    clinicalStatus: { text: allergy.status },
    code: { text: allergy.allergen },
    criticality: allergy.severity ?? undefined,
    onsetDateTime: allergy.onset_date,
    reaction: allergy.reaction?.length
      ? [{ manifestation: allergy.reaction.map((item) => ({ text: item })) }]
      : undefined,
    note: allergy.notes ? [{ text: allergy.notes }] : undefined,
  };
}

export function buildFhirObservation(result: Row<"lab_results">, patientId: string) {
  return {
    resourceType: "Observation",
    id: result.fhir_id ?? result.id,
    status: result.status,
    code: { text: result.test_name },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: result.observed_at,
    valueQuantity:
      result.result_value !== null ? { value: result.result_value, unit: result.unit } : undefined,
    valueString: result.result_text ?? undefined,
    interpretation: result.abnormal_flag ? [{ text: result.abnormal_flag }] : undefined,
    referenceRange: result.reference_range ? [{ text: result.reference_range }] : undefined,
  };
}

export function buildFhirMedicationRequest(item: Row<"prescriptions">, patientId: string) {
  return {
    resourceType: "MedicationRequest",
    id: item.id,
    status: item.status,
    intent: "order",
    subject: { reference: `Patient/${patientId}` },
    medicationCodeableConcept: { text: item.medication_name },
    authoredOn: item.prescribed_on,
    dosageInstruction: [{ text: `${item.dosage} ${item.frequency}`.trim() }],
    dispenseRequest: {
      numberOfRepeatsAllowed: item.refill_remaining,
      performer: item.pharmacy_name ? { display: item.pharmacy_name } : undefined,
      validityPeriod: item.expires_on ? { end: item.expires_on } : undefined,
    },
  };
}

export function buildFhirMedication(item: Row<"prescriptions">) {
  return {
    resourceType: "Medication",
    id: `medication-${item.id}`,
    code: { text: item.medication_name },
    form: item.route ? { text: item.route } : undefined,
    batch: item.expires_on ? { expirationDate: item.expires_on } : undefined,
  };
}

export function buildFhirDiagnosticReport(result: Row<"lab_results">, patientId: string) {
  return {
    resourceType: "DiagnosticReport",
    id: result.id,
    status: result.status,
    code: { text: result.panel_name },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: result.observed_at,
    result: [{ reference: `Observation/${result.fhir_id ?? result.id}`, display: result.test_name }],
    conclusion: result.result_text ?? undefined,
  };
}

export function buildFhirAppointment(item: Row<"appointments">, patientId: string) {
  return {
    resourceType: "Appointment",
    id: item.id,
    status: item.status,
    appointmentType: { text: readableText(item.appointment_type) },
    description: item.reason,
    start: item.scheduled_at,
    minutesDuration: item.duration_minutes,
    participant: [
      { actor: { reference: `Patient/${patientId}` }, status: "accepted" },
      { actor: { reference: `Practitioner/${item.provider_id}` }, status: "accepted" },
    ],
    comment: item.notes ?? undefined,
  };
}

export function buildFhirEncounter(item: Row<"appointments">, patientId: string) {
  return {
    resourceType: "Encounter",
    id: item.id,
    status: encounterStatus(item.status),
    class: encounterClass(item),
    subject: { reference: `Patient/${patientId}` },
    appointment: [{ reference: `Appointment/${item.id}` }],
    serviceType: [{ text: readableText(item.appointment_type) }],
    reasonCode: [{ text: item.reason }],
    participant: [{ individual: { reference: `Practitioner/${item.provider_id}` } }],
    period: {
      start: item.scheduled_at,
      end: addMinutes(item.scheduled_at, item.duration_minutes),
    },
    location: item.location ? [{ location: { display: item.location } }] : undefined,
  };
}

export function buildFhirProcedure(item: Row<"procedures">, patientId: string) {
  return {
    resourceType: "Procedure",
    id: item.id,
    status: item.performed_at ? "completed" : "preparation",
    category: item.category ? { text: readableText(item.category) } : undefined,
    code: { text: item.procedure_name },
    subject: { reference: `Patient/${patientId}` },
    performedDateTime: item.performed_at,
    performer: item.provider_id ? [{ actor: { reference: `Practitioner/${item.provider_id}` } }] : undefined,
    outcome: item.outcome ? { text: readableText(item.outcome) } : undefined,
    note: item.notes ? [{ text: item.notes }] : undefined,
  };
}

export function buildFhirImmunization(item: Row<"procedures">, patientId: string) {
  return {
    resourceType: "Immunization",
    id: item.id,
    status: "completed",
    vaccineCode: { text: item.procedure_name },
    patient: { reference: `Patient/${patientId}` },
    occurrenceDateTime: item.performed_at,
    performer: item.provider_id ? [{ actor: { reference: `Practitioner/${item.provider_id}` } }] : undefined,
    note: item.notes ? [{ text: item.notes }] : undefined,
  };
}

export function buildFhirDocumentReference(document: Row<"documents"> & { signedUrl?: string | null }, patientId: string) {
  return {
    resourceType: "DocumentReference",
    id: document.id,
    status: "current",
    subject: { reference: `Patient/${patientId}` },
    type: { text: readableText(document.category) },
    date: document.created_at,
    description: document.title,
    content: [
      {
        attachment: {
          contentType: document.mime_type ?? undefined,
          title: document.title,
          url: document.signedUrl ?? undefined,
        },
      },
    ],
  };
}

export function buildFhirCoverage(patient: Row<"patients">) {
  return {
    resourceType: "Coverage",
    id: `coverage-${patient.id}`,
    status: patient.insurance_provider ? "active" : "draft",
    beneficiary: { reference: `Patient/${patient.id}` },
    payor: patient.insurance_provider ? [{ display: patient.insurance_provider }] : [],
    subscriberId: patient.insurance_policy_no ?? undefined,
    class: patient.insurance_group_no
      ? [{ type: { text: "group" }, value: patient.insurance_group_no }]
      : undefined,
    period: patient.insurance_valid_until ? { end: patient.insurance_valid_until } : undefined,
  };
}

export function buildFhirConsent(consent: Row<"data_consents">, patientId: string) {
  return {
    resourceType: "Consent",
    id: consent.id,
    status: consent.granted ? "active" : "inactive",
    scope: { text: "patient privacy" },
    category: [{ text: readableText(consent.consent_type) }],
    patient: { reference: `Patient/${patientId}` },
    dateTime: consent.updated_at,
    provision: {
      type: consent.granted ? "permit" : "deny",
    },
  };
}

export function buildFhirPractitioner(provider: Row<"providers">) {
  return {
    resourceType: "Practitioner",
    id: provider.id,
    active: provider.accepting_patients,
    name: [{ text: `${provider.first_name} ${provider.last_name}`.trim() }],
    telecom: [
      ...(provider.email ? [{ system: "email", value: provider.email }] : []),
      ...(provider.phone ? [{ system: "phone", value: provider.phone }] : []),
    ],
    address: provider.city || provider.state
      ? [{ city: provider.city ?? undefined, state: provider.state ?? undefined }]
      : undefined,
    qualification: [{ code: { text: provider.specialty } }],
    communication: provider.languages?.map((language) => ({ text: language })) ?? undefined,
  };
}

const supportedFhirResources = [
  "Patient",
  "Practitioner",
  "Condition",
  "AllergyIntolerance",
  "Observation",
  "DiagnosticReport",
  "Medication",
  "MedicationRequest",
  "Appointment",
  "Encounter",
  "Procedure",
  "Immunization",
  "DocumentReference",
  "Coverage",
  "Consent",
] as const;

export function buildFhirCapabilityStatement() {
  return {
    resourceType: "CapabilityStatement",
    status: "active",
    date: new Date().toISOString(),
    kind: "instance",
    software: {
      name: "MedConnect Pro",
      version: "0.1.0",
    },
    implementation: {
      description: "FHIR R4 surface for the MedConnect Pro patient portal and care-team workspace.",
    },
    fhirVersion: "4.0.1",
    format: ["application/fhir+json"],
    rest: [
      {
        mode: "server",
        resource: supportedFhirResources.map((type) => ({
          type,
          interaction: [{ code: "read" }, { code: "search-type" }],
        })),
      },
    ],
  };
}