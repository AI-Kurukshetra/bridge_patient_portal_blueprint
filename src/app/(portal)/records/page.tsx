import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function RecordsPage() {
  const data = await getPortalData();
  if (!data) return null;

  if (data.patient) {
    await logAudit({
      action: "VIEW_HEALTH_RECORDS",
      metadata: {
        allergies: data.allergies.length,
        conditions: data.conditions.length,
        procedures: data.procedures.length,
      },
      patientId: data.patient.id,
      resourceType: "health-records",
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard title="Conditions" description="Active and historical diagnoses">
        <div className="grid gap-3">
          {data.conditions.length === 0 ? <EmptyState title="No conditions" body="Conditions will appear here when added by your care team." /> : data.conditions.map((condition) => (
            <div key={condition.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{condition.display_name}</p><StatusBadge value={condition.clinical_status} /></div><p className="mt-2 text-sm text-slate-300">ICD-10: {condition.icd10_code ?? "Not specified"}</p><p className="mt-1 text-sm text-slate-400">Onset: {condition.onset_date ? formatDate(condition.onset_date) : "Unknown"}</p></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Allergies" description="Medication, food, and environmental">
        <div className="grid gap-3">
          {data.allergies.length === 0 ? <EmptyState title="No allergies" body="Active allergies will appear here." /> : data.allergies.map((allergy) => (
            <div key={allergy.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{allergy.allergen}</p><StatusBadge value={allergy.severity ?? allergy.status} /></div><p className="mt-2 text-sm text-slate-300">{allergy.reaction?.join(", ") ?? "Reaction not documented"}</p></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Procedures" description="Imaging, surgeries, vaccinations, and more">
        <div className="grid gap-3">
          {data.procedures.length === 0 ? <EmptyState title="No procedures" body="Completed procedures will appear here." /> : data.procedures.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-medium text-white">{item.procedure_name}</p><p className="mt-2 text-sm text-slate-300">{item.category ?? "General"}</p><p className="mt-1 text-sm text-slate-400">{item.performed_at ? formatDate(item.performed_at) : "Date unavailable"}</p></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
