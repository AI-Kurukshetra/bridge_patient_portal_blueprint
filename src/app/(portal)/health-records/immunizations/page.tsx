import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function ImmunizationsPage() {
  const data = await getPortalData();
  if (!data) return null;

  const immunizations = data.procedures.filter((item) => {
    const category = item.category?.toLowerCase() ?? "";
    return category.includes("immun") || category.includes("vaccin");
  });

  return (
    <SectionCard title="Immunizations" description="Vaccination and immunization history.">
      <div className="grid gap-3">
        {immunizations.length === 0 ? <EmptyState title="No immunizations" body="No vaccination procedures are available in the current patient record." /> : immunizations.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{item.procedure_name}</p><StatusBadge value={item.outcome ?? "completed"} /></div><p className="mt-2 text-sm text-slate-400">{item.performed_at ? formatDate(item.performed_at) : "Date unavailable"}</p></div>
        ))}
      </div>
    </SectionCard>
  );
}
