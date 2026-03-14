import { HealthExportForm } from "@/components/forms/health-export-form";
import { SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { getPortalData } from "@/lib/queries/portal";
import { formatDateTime } from "@/lib/utils";

export default async function DataExportPage() {
  const data = await getPortalData();
  if (!data || !data.patient || !data.profile) return null;

  const structuredRecords = data.conditions.length + data.allergies.length + data.procedures.length + data.labResults.length + data.prescriptions.length;
  const fhirResourceCount =
    1 +
    data.conditions.length +
    data.allergies.length +
    data.procedures.length +
    data.procedures.filter((item) => {
      const category = item.category?.toLowerCase() ?? "";
      return category.includes("immun") || category.includes("vaccin");
    }).length +
    data.labResults.length * 2 +
    data.prescriptions.length * 2 +
    data.appointments.length * 2 +
    data.documents.length +
    data.consents.length +
    (data.patient.insurance_provider ? 1 : 0);
  const lastExport = data.recentActivities.find((item) => item.title === "Health data export requested") ?? null;

  const availableSections = [
    { label: "Profile and coverage", count: 1, description: "Demographics, emergency contacts, and insurance context." },
    { label: "Appointments", count: data.appointments.length, description: "Visit schedule, status, and care team assignments." },
    { label: "Clinical history", count: data.conditions.length + data.allergies.length + data.procedures.length, description: "Problems, allergies, procedures, and immunizations." },
    { label: "Lab results", count: data.labResults.length, description: "Structured observations and diagnostic report data." },
    { label: "Medications", count: data.prescriptions.length, description: "Medication orders, refill data, and pharmacy context." },
    { label: "Documents", count: data.documents.length, description: "Uploaded patient files and linked document references." },
    { label: "Consents", count: data.consents.length, description: "Data sharing permissions and privacy preferences." },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Structured records" value={String(structuredRecords)} detail="Clinical items available for portable export." />
        <StatCard label="FHIR resources" value={String(fhirResourceCount)} detail="Interoperable resources available in standards format." />
        <StatCard label="Document files" value={String(data.documents.length)} detail="Signed file links can be included in export metadata." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Health data export" description="Generate your record as PDF, CSV, or FHIR JSON with audited access and patient-controlled section selection.">
          <HealthExportForm />
        </SectionCard>

        <SectionCard title="Export contents" description="The download includes the same clinical domains shown throughout the patient portal.">
          <div className="grid gap-3">
            {availableSections.map((section) => (
              <div key={section.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{section.label}</p>
                  <StatusBadge value={section.count > 0 ? "active" : "low"} />
                </div>
                <p className="mt-2 text-sm text-slate-300">{section.description}</p>
                <p className="mt-2 text-sm text-slate-500">Records available: {section.count}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-slate-200">
            <p className="font-medium text-white">Export notes</p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300">
              <li>PDF exports are formatted for review and sharing.</li>
              <li>CSV exports flatten the patient timeline for spreadsheet workflows.</li>
              <li>FHIR JSON exports preserve standards-based clinical resources for interoperability.</li>
            </ul>
          </div>

          {lastExport ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Last export request</p>
              <p className="mt-2">{lastExport.detail}</p>
              <p className="mt-1 text-slate-500">{formatDateTime(lastExport.occurred_at)}</p>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}