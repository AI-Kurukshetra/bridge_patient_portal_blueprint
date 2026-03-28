import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelAppointmentAction } from "@/lib/actions/appointments";
import { AppointmentRescheduleForm } from "@/components/forms/appointment-reschedule-form";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPortalData();
  if (!data) return null;

  const appointment = data.appointments.find((item) => item.id === id);
  if (!appointment) notFound();

  const provider = data.providers.find((item) => item.id === appointment.provider_id) ?? null;
  const isActive = appointment.status !== "cancelled" && appointment.status !== "completed";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard title={appointment.reason} description="Appointment detail and scheduling context.">
        <div className="grid gap-4 text-sm text-slate-300">
          <div className="flex items-center justify-between gap-3"><p>Date and time</p><p className="text-right text-white">{formatDateTime(appointment.scheduled_at)}</p></div>
          <div className="flex items-center justify-between gap-3"><p>Visit type</p><p className="text-white capitalize">{appointment.appointment_type.replaceAll("_", " ")}</p></div>
          <div className="flex items-center justify-between gap-3"><p>Status</p><StatusBadge value={appointment.status} /></div>
          <div className="flex items-center justify-between gap-3"><p>Duration</p><p className="text-white">{appointment.duration_minutes} minutes</p></div>
          <div className="flex items-center justify-between gap-3"><p>Provider</p><p className="text-right text-white">{provider ? `Dr. ${provider.first_name} ${provider.last_name}` : "Care team provider"}</p></div>
          <div className="flex items-center justify-between gap-3"><p>Location</p><p className="text-right text-white">{appointment.location ?? (appointment.appointment_type === "telehealth" ? "Telehealth visit" : "Assigned by care team")}</p></div>
          {appointment.meeting_url ? (
            <div className="flex items-center justify-between gap-3">
              <p>Telehealth link</p>
              <a href={appointment.meeting_url} className="text-cyan-200 transition hover:text-cyan-100">Open visit link</a>
            </div>
          ) : null}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Notes</p>
            <p className="mt-2">{appointment.notes ?? "No additional notes provided."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/appointments" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-400 hover:text-cyan-200">Back to appointments</Link>
            {isActive ? (
              <form action={async () => { "use server"; await cancelAppointmentAction(appointment.id); }}>
                <button className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-rose-400 hover:text-rose-200">Cancel appointment</button>
              </form>
            ) : null}
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title={isActive ? "Reschedule visit" : "Appointment outcome"}
        description={isActive ? "Choose a new time and keep the care team updated." : "This visit is in a terminal state and can no longer be changed."}
      >
        {isActive ? (
          <AppointmentRescheduleForm
            appointmentId={appointment.id}
            scheduledAt={appointment.scheduled_at}
            durationMinutes={appointment.duration_minutes}
            location={appointment.location}
            notes={appointment.notes}
          />
        ) : (
          <div className="grid gap-3 text-sm text-slate-300">
            <p>The appointment is currently marked <span className="text-white">{appointment.status}</span>.</p>
            <p>If you need additional help, send a secure message or contact the care team directly.</p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}