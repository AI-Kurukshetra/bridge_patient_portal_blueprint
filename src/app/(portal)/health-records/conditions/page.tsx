import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function ConditionsPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <SectionCard title="Conditions" description="Active and historical diagnoses.">
      <div className="grid gap-3">
        {data.conditions.length === 0 ? <EmptyState title="No conditions" body="Conditions will appear here when documented by your care team." /> : data.conditions.map((condition) => (
          <div key={condition.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{condition.display_name}</p><StatusBadge value={condition.clinical_status} /></div><p className="mt-2 text-sm text-slate-300">Severity: {condition.severity ?? "Not documented"}</p><p className="mt-1 text-sm text-slate-400">Onset: {condition.onset_date ? formatDate(condition.onset_date) : "Unknown"}</p></div>
        ))}
      </div>
    </SectionCard>
  );
}
