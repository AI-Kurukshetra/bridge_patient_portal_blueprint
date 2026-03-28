import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { getPortalData } from "@/lib/queries/portal";

export default async function AllergiesPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <SectionCard title="Allergies" description="Medication, food, and environmental reactions.">
      <div className="grid gap-3">
        {data.allergies.length === 0 ? <EmptyState title="No allergies" body="Allergies will appear here once documented." /> : data.allergies.map((allergy) => (
          <div key={allergy.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{allergy.allergen}</p><StatusBadge value={allergy.severity ?? allergy.status} /></div><p className="mt-2 text-sm text-slate-300">Reaction: {allergy.reaction?.join(", ") ?? "Reaction not documented"}</p></div>
        ))}
      </div>
    </SectionCard>
  );
}
