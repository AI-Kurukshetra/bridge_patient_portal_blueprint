import Link from "next/link";
import { SectionCard } from "@/components/ui/primitives";

const links = [
  { href: "/records", label: "Unified records view", body: "See conditions, allergies, and procedures together." },
  { href: "/health-records/conditions", label: "Conditions", body: "Review active and historical diagnoses." },
  { href: "/health-records/allergies", label: "Allergies", body: "Medication, food, and environmental allergy tracking." },
  { href: "/health-records/immunizations", label: "Immunizations", body: "Vaccination and immunization history." },
  { href: "/health-records/vitals", label: "Vitals", body: "Height, weight, donor preference, and baseline metrics." },
];

export default function HealthRecordsHubPage() {
  return (
    <SectionCard title="Health records" description="Choose a focused clinical view or return to the unified records workspace.">
      <div className="grid gap-3 md:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5">
            <p className="font-medium text-white">{item.label}</p>
            <p className="mt-2 text-sm text-slate-300">{item.body}</p>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
