import { buildFhirPatient } from "@/lib/fhir/patient";
import {
  buildFhirAllergy,
  buildFhirAppointment,
  buildFhirCondition,
  buildFhirConsent,
  buildFhirCoverage,
  buildFhirDiagnosticReport,
  buildFhirDocumentReference,
  buildFhirEncounter,
  buildFhirImmunization,
  buildFhirMedication,
  buildFhirMedicationRequest,
  buildFhirObservation,
  buildFhirPractitioner,
  buildFhirProcedure,
} from "@/lib/fhir/resources";
import { makeBundle } from "@/lib/fhir/utils";
import type { PortalData } from "@/lib/queries/portal";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { HealthDataExportInput, HealthExportFormat } from "@/lib/validations/export";
import type { Row } from "@/types/database";

type ExportPortalData = PortalData & {
  patient: NonNullable<PortalData["patient"]>;
  profile: NonNullable<PortalData["profile"]>;
};

type CsvRow = {
  section: string;
  date: string;
  title: string;
  status: string;
  details: string;
  provider: string;
  referenceId: string;
};

function ensureExportableData(data: PortalData): ExportPortalData {
  if (!data.patient || !data.profile) {
    throw new Error("Patient export data is unavailable for the current account.");
  }

  return data as ExportPortalData;
}

function buildProviderMap(providers: Row<"providers">[]) {
  return new Map(providers.map((provider) => [provider.id, provider]));
}

function getProviderDisplayName(providerId: string | null | undefined, providerMap: Map<string, Row<"providers">>) {
  if (!providerId) {
    return "Care team";
  }

  const provider = providerMap.get(providerId);
  if (!provider) {
    return "Care team";
  }

  return `Dr. ${provider.first_name} ${provider.last_name}`;
}

function isImmunizationProcedure(item: Row<"procedures">) {
  const category = item.category?.toLowerCase() ?? "";
  return category.includes("immun") || category.includes("vaccin");
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function readableStatus(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not recorded";
}

function sanitizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function wrapText(value: string, width = 88) {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length > width) {
      for (let index = 0; index < word.length; index += width) {
        lines.push(word.slice(index, index + width));
      }
      current = "";
      continue;
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function buildPdfDocument(lines: string[]) {
  const linesPerPage = 48;
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push(["MedConnect Pro health data export"]);
  }

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("placeholder-pages-root");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageObjectNumbers: number[] = [];

  for (const pageLines of pages) {
    const contentStream = [
      "BT",
      "/F1 10 Tf",
      "14 TL",
      "40 756 Td",
      ...pageLines.flatMap((line, index) => (index === 0 ? [`(${sanitizePdfText(line)}) Tj`] : ["T*", `(${sanitizePdfText(line)}) Tj`])),
      "ET",
    ].join("\n");

    const contentObjectNumber = objects.length + 1;
    objects.push(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);

    const pageObjectNumber = objects.length + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
  }

  objects[1] = `<< /Type /Pages /Count ${pageObjectNumbers.length} /Kids [${pageObjectNumbers.map((value) => `${value} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index++) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index++) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}

function getSelectedSections(selection: HealthDataExportInput) {
  return [
    selection.includeProfile ? "profile" : null,
    selection.includeAppointments ? "appointments" : null,
    selection.includeClinicalHistory ? "clinical history" : null,
    selection.includeLabResults ? "lab results" : null,
    selection.includeMedications ? "medications" : null,
    selection.includeDocuments ? "documents" : null,
    selection.includeConsents ? "consents" : null,
  ].filter((value): value is string => Boolean(value));
}

export function getHealthExportSectionLabels(selection: HealthDataExportInput) {
  return getSelectedSections(selection);
}

export function buildHealthExportFilename(format: HealthExportFormat) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const extension = format === "fhir_json" ? "json" : format;
  return `medconnect-health-export-${dateStamp}.${extension}`;
}

function buildCsvRows(data: ExportPortalData, selection: HealthDataExportInput) {
  const providerMap = buildProviderMap(data.providers);
  const rows: CsvRow[] = [];

  if (selection.includeProfile) {
    rows.push({
      section: "profile",
      date: formatDate(data.profile.updated_at),
      title: "Patient demographics",
      status: "active",
      details: `Name ${data.profile.full_name}; MRN ${data.patient.patient_mrn}; DOB ${data.profile.date_of_birth ?? "not recorded"}; blood type ${data.patient.blood_type ?? "not recorded"}`,
      provider: getProviderDisplayName(data.patient.primary_provider_id, providerMap),
      referenceId: data.patient.id,
    });
    rows.push({
      section: "profile",
      date: formatDate(data.patient.updated_at),
      title: "Emergency and insurance",
      status: data.patient.insurance_provider ? "insured" : "pending",
      details: `Emergency contact ${data.patient.emergency_contact_name ?? "not recorded"}; insurance ${data.patient.insurance_provider ?? "not recorded"}; policy ${data.patient.insurance_policy_no ?? "not recorded"}`,
      provider: getProviderDisplayName(data.patient.primary_provider_id, providerMap),
      referenceId: data.patient.id,
    });
  }

  if (selection.includeAppointments) {
    rows.push(
      ...data.appointments.map((item) => ({
        section: "appointments",
        date: formatDateTime(item.scheduled_at),
        title: item.reason,
        status: readableStatus(item.status),
        details: `${readableStatus(item.appointment_type)} visit${item.location ? ` at ${item.location}` : ""}`,
        provider: getProviderDisplayName(item.provider_id, providerMap),
        referenceId: item.id,
      })),
    );
  }

  if (selection.includeClinicalHistory) {
    rows.push(
      ...data.conditions.map((item) => ({
        section: "clinical history",
        date: formatDate(item.onset_date ?? item.resolved_date ?? data.patient.created_at),
        title: item.display_name,
        status: readableStatus(item.clinical_status),
        details: item.notes ?? item.icd10_code ?? "Diagnosis",
        provider: getProviderDisplayName(item.provider_id, providerMap),
        referenceId: item.id,
      })),
    );
    rows.push(
      ...data.allergies.map((item) => ({
        section: "clinical history",
        date: formatDate(item.onset_date ?? data.patient.created_at),
        title: item.allergen,
        status: readableStatus(item.severity ?? item.status),
        details: item.reaction?.join(", ") ?? item.notes ?? "Reaction not documented",
        provider: "Care team",
        referenceId: item.id,
      })),
    );
    rows.push(
      ...data.procedures.map((item) => ({
        section: isImmunizationProcedure(item) ? "immunizations" : "clinical history",
        date: formatDate(item.performed_at ?? data.patient.created_at),
        title: item.procedure_name,
        status: readableStatus(item.outcome ?? "completed"),
        details: item.category ?? "Procedure",
        provider: getProviderDisplayName(item.provider_id, providerMap),
        referenceId: item.id,
      })),
    );
  }

  if (selection.includeLabResults) {
    rows.push(
      ...data.labResults.map((item) => ({
        section: "lab results",
        date: formatDateTime(item.observed_at),
        title: item.test_name,
        status: readableStatus(item.abnormal_flag ?? item.status),
        details: item.result_value !== null ? `${item.result_value} ${item.unit ?? ""}`.trim() : item.result_text ?? item.panel_name,
        provider: getProviderDisplayName(item.provider_id, providerMap),
        referenceId: item.id,
      })),
    );
  }

  if (selection.includeMedications) {
    rows.push(
      ...data.prescriptions.map((item) => ({
        section: "medications",
        date: formatDate(item.prescribed_on),
        title: item.medication_name,
        status: readableStatus(item.status),
        details: `${item.dosage}; ${item.frequency}; refills ${item.refill_remaining}`,
        provider: getProviderDisplayName(item.provider_id, providerMap),
        referenceId: item.id,
      })),
    );
  }

  if (selection.includeDocuments) {
    rows.push(
      ...data.documents.map((item) => ({
        section: "documents",
        date: formatDate(item.created_at),
        title: item.title,
        status: readableStatus(item.category),
        details: item.mime_type ?? "Unknown file type",
        provider: "Patient portal",
        referenceId: item.id,
      })),
    );
  }

  if (selection.includeConsents) {
    rows.push(
      ...data.consents.map((item) => ({
        section: "consents",
        date: formatDateTime(item.updated_at),
        title: readableStatus(item.consent_type),
        status: item.granted ? "granted" : "revoked",
        details: item.granted ? `Granted at ${item.granted_at ?? "not recorded"}` : `Revoked at ${item.revoked_at ?? "not recorded"}`,
        provider: "Patient",
        referenceId: item.id,
      })),
    );
  }

  return rows;
}

export function buildHealthExportCsv(data: PortalData, selection: HealthDataExportInput) {
  const exportData = ensureExportableData(data);
  const rows = buildCsvRows(exportData, selection);
  const header = ["section", "date", "title", "status", "details", "provider", "reference_id"];
  const csvRows = rows.map((row) => [
    row.section,
    row.date,
    row.title,
    row.status,
    row.details,
    row.provider,
    row.referenceId,
  ].map(csvCell).join(","));

  return [header.join(","), ...csvRows].join("\n");
}

export function buildHealthExportFhirBundle(data: PortalData, selection: HealthDataExportInput) {
  const exportData = ensureExportableData(data);
  const entries: { resource: unknown }[] = [];
  const providerMap = buildProviderMap(exportData.providers);
  const referencedProviderIds = new Set<string>();

  entries.push({ resource: buildFhirPatient(exportData.profile, exportData.patient) });

  if (selection.includeProfile) {
    if (exportData.patient.primary_provider_id) {
      referencedProviderIds.add(exportData.patient.primary_provider_id);
    }

    if (exportData.patient.insurance_provider) {
      entries.push({ resource: buildFhirCoverage(exportData.patient) });
    }
  }

  if (selection.includeAppointments) {
    for (const item of exportData.appointments) {
      referencedProviderIds.add(item.provider_id);
      entries.push({ resource: buildFhirAppointment(item, exportData.patient.id) });
      entries.push({ resource: buildFhirEncounter(item, exportData.patient.id) });
    }
  }

  if (selection.includeClinicalHistory) {
    for (const item of exportData.conditions) {
      if (item.provider_id) {
        referencedProviderIds.add(item.provider_id);
      }
      entries.push({ resource: buildFhirCondition(item, exportData.patient.id) });
    }

    for (const item of exportData.allergies) {
      entries.push({ resource: buildFhirAllergy(item, exportData.patient.id) });
    }

    for (const item of exportData.procedures) {
      if (item.provider_id) {
        referencedProviderIds.add(item.provider_id);
      }
      entries.push({ resource: buildFhirProcedure(item, exportData.patient.id) });
      if (isImmunizationProcedure(item)) {
        entries.push({ resource: buildFhirImmunization(item, exportData.patient.id) });
      }
    }
  }

  if (selection.includeLabResults) {
    for (const item of exportData.labResults) {
      if (item.provider_id) {
        referencedProviderIds.add(item.provider_id);
      }
      entries.push({ resource: buildFhirObservation(item, exportData.patient.id) });
      entries.push({ resource: buildFhirDiagnosticReport(item, exportData.patient.id) });
    }
  }

  if (selection.includeMedications) {
    for (const item of exportData.prescriptions) {
      if (item.provider_id) {
        referencedProviderIds.add(item.provider_id);
      }
      entries.push({ resource: buildFhirMedication(item) });
      entries.push({ resource: buildFhirMedicationRequest(item, exportData.patient.id) });
    }
  }

  if (selection.includeDocuments) {
    for (const item of exportData.documents) {
      entries.push({ resource: buildFhirDocumentReference(item, exportData.patient.id) });
    }
  }

  if (selection.includeConsents) {
    for (const item of exportData.consents) {
      entries.push({ resource: buildFhirConsent(item, exportData.patient.id) });
    }
  }

  for (const providerId of referencedProviderIds) {
    const provider = providerMap.get(providerId);
    if (provider) {
      entries.push({ resource: buildFhirPractitioner(provider) });
    }
  }

  return makeBundle(entries, entries.length);
}

export function buildHealthExportPdf(data: PortalData, selection: HealthDataExportInput) {
  const exportData = ensureExportableData(data);
  const providerMap = buildProviderMap(exportData.providers);
  const lines: string[] = [];
  const selectedSections = getSelectedSections(selection);

  lines.push("MedConnect Pro health data export");
  lines.push(`Generated ${formatDateTime(new Date())}`);
  lines.push(`Patient ${exportData.profile.full_name}`);
  lines.push(`MRN ${exportData.patient.patient_mrn}`);
  lines.push(`Sections ${selectedSections.join(", ")}`);
  lines.push("");

  if (selection.includeProfile) {
    lines.push("Profile and coverage");
    lines.push(...wrapText(`DOB ${exportData.profile.date_of_birth ?? "not recorded"}; language ${exportData.profile.preferred_lang}; blood type ${exportData.patient.blood_type ?? "not recorded"}`));
    lines.push(...wrapText(`Emergency contact ${exportData.patient.emergency_contact_name ?? "not recorded"}; phone ${exportData.patient.emergency_contact_phone ?? "not recorded"}; relationship ${exportData.patient.emergency_contact_rel ?? "not recorded"}`));
    lines.push(...wrapText(`Insurance ${exportData.patient.insurance_provider ?? "not recorded"}; policy ${exportData.patient.insurance_policy_no ?? "not recorded"}; group ${exportData.patient.insurance_group_no ?? "not recorded"}`));
    lines.push("");
  }

  if (selection.includeAppointments) {
    lines.push(`Appointments (${exportData.appointments.length})`);
    if (exportData.appointments.length === 0) {
      lines.push("No appointments available.");
    } else {
      for (const item of exportData.appointments.slice(0, 20)) {
        lines.push(...wrapText(`${formatDateTime(item.scheduled_at)} | ${item.reason} | ${readableStatus(item.status)} | ${getProviderDisplayName(item.provider_id, providerMap)}`));
      }
    }
    lines.push("");
  }

  if (selection.includeClinicalHistory) {
    lines.push(`Clinical history (${exportData.conditions.length + exportData.allergies.length + exportData.procedures.length})`);
    if (exportData.conditions.length === 0 && exportData.allergies.length === 0 && exportData.procedures.length === 0) {
      lines.push("No clinical history available.");
    } else {
      for (const item of exportData.conditions.slice(0, 12)) {
        lines.push(...wrapText(`Condition | ${item.display_name} | ${readableStatus(item.clinical_status)} | ${item.icd10_code ?? "no ICD-10 code"}`));
      }
      for (const item of exportData.allergies.slice(0, 12)) {
        lines.push(...wrapText(`Allergy | ${item.allergen} | ${readableStatus(item.severity ?? item.status)} | ${item.reaction?.join(", ") ?? "reaction not documented"}`));
      }
      for (const item of exportData.procedures.slice(0, 12)) {
        const label = isImmunizationProcedure(item) ? "Immunization" : "Procedure";
        lines.push(...wrapText(`${label} | ${item.procedure_name} | ${formatDate(item.performed_at ?? exportData.patient.created_at)} | ${getProviderDisplayName(item.provider_id, providerMap)}`));
      }
    }
    lines.push("");
  }

  if (selection.includeLabResults) {
    lines.push(`Lab results (${exportData.labResults.length})`);
    if (exportData.labResults.length === 0) {
      lines.push("No lab results available.");
    } else {
      for (const item of exportData.labResults.slice(0, 20)) {
        const resultValue = item.result_value !== null ? `${item.result_value} ${item.unit ?? ""}`.trim() : item.result_text ?? item.panel_name;
        lines.push(...wrapText(`${formatDateTime(item.observed_at)} | ${item.test_name} | ${resultValue} | ${readableStatus(item.abnormal_flag ?? item.status)}`));
      }
    }
    lines.push("");
  }

  if (selection.includeMedications) {
    lines.push(`Medications (${exportData.prescriptions.length})`);
    if (exportData.prescriptions.length === 0) {
      lines.push("No medications available.");
    } else {
      for (const item of exportData.prescriptions.slice(0, 20)) {
        lines.push(...wrapText(`${item.medication_name} | ${item.dosage} | ${item.frequency} | ${readableStatus(item.status)} | refills ${item.refill_remaining}`));
      }
    }
    lines.push("");
  }

  if (selection.includeDocuments) {
    lines.push(`Documents (${exportData.documents.length})`);
    if (exportData.documents.length === 0) {
      lines.push("No documents available.");
    } else {
      for (const item of exportData.documents.slice(0, 20)) {
        lines.push(...wrapText(`${formatDate(item.created_at)} | ${item.title} | ${readableStatus(item.category)} | ${item.mime_type ?? "unknown file type"}`));
      }
    }
    lines.push("");
  }

  if (selection.includeConsents) {
    lines.push(`Consents (${exportData.consents.length})`);
    if (exportData.consents.length === 0) {
      lines.push("No consent records available.");
    } else {
      for (const item of exportData.consents.slice(0, 20)) {
        lines.push(...wrapText(`${readableStatus(item.consent_type)} | ${item.granted ? "granted" : "revoked"} | updated ${formatDateTime(item.updated_at)}`));
      }
    }
  }

  return buildPdfDocument(lines);
}