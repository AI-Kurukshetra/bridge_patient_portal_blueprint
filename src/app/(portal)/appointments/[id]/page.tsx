import { notFound } from "next/navigation";
import { cancelAppointmentAction } from "@/lib/actions/appointments";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPortalData();
  if (!data) return null;

  const appointment = data.appointments.find((item) => item.id === id);
  if (!appointment) notFound();

  return (
    <SectionCard title={appointment.reason} description="Appointment detail and scheduling context.">
      <div className="grid gap-4 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3"><p>Date and time</p><p className="text-white">{formatDateTime(appointment.scheduled_at)}</p></div>
        <div className="flex items-center justify-between gap-3"><p>Visit type</p><p className="text-white capitalize">{appointment.appointment_type.replaceAll("_", " ")}</p></div>
        <div className="flex items-center justify-between gap-3"><p>Status</p><StatusBadge value={appointment.status} /></div>
        <div className="flex items-center justify-between gap-3"><p>Duration</p><p className="text-white">{appointment.duration_minutes} minutes</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-medium text-white">Notes</p>
          <p className="mt-2">{appointment.notes ?? "No additional notes provided."}</p>
        </div>
        {appointment.status !== "cancelled" && appointment.status !== "completed" ? (
          <form action={async () => { "use server"; await cancelAppointmentAction(appointment.id); }}>
            <button className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-rose-400 hover:text-rose-200">Cancel appointment</button>
          </form>
        ) : null}
      </div>
    </SectionCard>
  );
}
