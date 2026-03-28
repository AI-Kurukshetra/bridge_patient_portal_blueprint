import Link from "next/link";
import { cancelAppointmentAction } from "@/lib/actions/appointments";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function AppointmentsPage() {
  const data = await getPortalData();
  if (!data) return null;

  const providerMap = new Map(data.providers.map((provider) => [provider.id, provider]));

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard title="Schedule appointment" description="Client-side and server-side validated scheduling form.">
        <AppointmentForm providers={data.providers} />
        <div className="mt-4">
          <Link href="/appointments/schedule" className="text-sm text-cyan-200 transition hover:text-cyan-100">Open the dedicated scheduling workspace</Link>
        </div>
      </SectionCard>
      <SectionCard title="Appointments" description="Upcoming and historical encounters with your care team.">
        <div className="grid gap-3">
          {data.appointments.length === 0 ? <EmptyState title="No appointments" body="Schedule your first visit to see it here." /> : data.appointments.map((item) => {
            const provider = providerMap.get(item.provider_id) ?? null;
            const isActive = item.status !== "cancelled" && item.status !== "completed";

            return (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.reason}</p>
                    <p className="text-sm text-slate-400">{formatDateTime(item.scheduled_at)}</p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                  <p>Provider: <span className="text-white">{provider ? `Dr. ${provider.first_name} ${provider.last_name}` : "Care team provider"}</span></p>
                  <p>Visit type: <span className="text-white capitalize">{item.appointment_type.replaceAll("_", " ")}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/appointments/${item.id}`} className="rounded-2xl border border-white/10 px-3 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-200">View details</Link>
                  {isActive ? (
                    <form action={async () => { "use server"; await cancelAppointmentAction(item.id); }}>
                      <button className="rounded-2xl border border-white/10 px-3 py-2 text-sm transition hover:border-rose-400 hover:text-rose-200">Cancel appointment</button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}