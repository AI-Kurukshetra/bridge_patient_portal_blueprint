import { SectionCard, StatCard } from "@/components/ui/primitives";
import { getPortalData } from "@/lib/queries/portal";

export default async function VitalsPage() {
  const data = await getPortalData();
  if (!data || !data.patient) return null;

  const bmi = data.patient.height_cm && data.patient.weight_kg
    ? (data.patient.weight_kg / ((data.patient.height_cm / 100) ** 2)).toFixed(1)
    : "N/A";

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Height" value={data.patient.height_cm ? `${data.patient.height_cm} cm` : "N/A"} detail="Baseline patient profile measurement" />
        <StatCard label="Weight" value={data.patient.weight_kg ? `${data.patient.weight_kg} kg` : "N/A"} detail="Most recently stored profile weight" />
        <StatCard label="BMI" value={String(bmi)} detail="Derived from stored height and weight" />
      </div>
      <SectionCard title="Additional health profile metrics" description="Baseline values available in the patient profile.">
        <div className="grid gap-3 text-sm text-slate-300">
          <div className="flex items-center justify-between gap-3"><p>Blood type</p><p className="text-white">{data.patient.blood_type ?? "Not recorded"}</p></div>
          <div className="flex items-center justify-between gap-3"><p>Advance directive</p><p className="text-white">{data.patient.advance_directive ? "On file" : "Not on file"}</p></div>
          <div className="flex items-center justify-between gap-3"><p>Organ donor</p><p className="text-white">{data.patient.organ_donor ? "Yes" : "No"}</p></div>
        </div>
      </SectionCard>
    </div>
  );
}
