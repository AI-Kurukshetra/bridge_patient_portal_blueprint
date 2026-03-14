import { cancelAppointmentAction } from "@/lib/actions/appointments";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function AppointmentsPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard title="Schedule appointment" description="Client-side and server-side validated scheduling form.">
        <AppointmentForm providers={data.providers} />
      </SectionCard>
      <SectionCard title="Appointments" description="Upcoming and historical encounters">
        <div className="grid gap-3">
          {data.appointments.length === 0 ? <EmptyState title="No appointments" body="Schedule your first visit to see it here." /> : data.appointments.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-white">{item.reason}</p><p className="text-sm text-slate-400">{formatDateTime(item.scheduled_at)}</p></div><StatusBadge value={item.status} /></div>{item.status !== "cancelled" && item.status !== "completed" ? <form action={async () => { "use server"; await cancelAppointmentAction(item.id); }} className="mt-4"><button className="rounded-2xl border border-white/10 px-3 py-2 text-sm transition hover:border-rose-400 hover:text-rose-200">Cancel appointment</button></form> : null}</div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

