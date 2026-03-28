import Link from "next/link";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { SectionCard } from "@/components/ui/primitives";
import { getPortalData } from "@/lib/queries/portal";

export default async function ScheduleAppointmentPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <SectionCard title="Schedule appointment" description="Book a new visit with client and server validation.">
        <AppointmentForm providers={data.providers} />
      </SectionCard>
      <SectionCard title="Scheduling notes" description="Plan ahead before confirming your visit.">
        <div className="grid gap-3 text-sm text-slate-300">
          <p>Select the provider, visit type, date, and reason for care.</p>
          <p>Telehealth, imaging, lab, annual, and follow-up workflows are supported.</p>
          <Link href="/appointments" className="text-cyan-300 transition hover:text-cyan-200">Back to appointments</Link>
        </div>
      </SectionCard>
    </div>
  );
}
