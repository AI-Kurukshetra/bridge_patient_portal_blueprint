import Link from "next/link";
import { ProviderAppointmentStatusForm } from "@/components/forms/provider-appointment-status-form";
import { PortalShell } from "@/components/layout/portal-shell";
import { EmptyState, SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { getRoleLabel } from "@/lib/auth/roles";
import { getProviderAppointmentsWorkspace } from "@/lib/queries/provider-appointments";
import { formatDateTime } from "@/lib/utils";

export default async function CareTeamAppointmentsPage() {
  const { auth, provider, appointments } = await getProviderAppointmentsWorkspace();

  if (!provider) {
    return (
      <PortalShell profileName={auth.profile.full_name} roleLabel={getRoleLabel(auth.role)} subtitle="Care team workspace" variant="provider">
        <SectionCard title="Provider profile setup required" description="Link this provider account before managing appointments.">
          <p className="text-sm text-slate-300">Appointments can only be managed after this account is associated with a provider directory record.</p>
        </SectionCard>
      </PortalShell>
    );
  }

  const now = new Date();
  const upcoming = appointments.filter((item) => new Date(item.scheduled_at) >= now && item.status !== "cancelled").length;
  const awaitingConfirmation = appointments.filter((item) => item.status === "scheduled").length;
  const completed = appointments.filter((item) => item.status === "completed").length;

  return (
    <PortalShell profileName={auth.profile.full_name} roleLabel={getRoleLabel(auth.role)} subtitle="Care team workspace" variant="provider">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Upcoming visits" value={String(upcoming)} detail="Future visits on this provider schedule" />
          <StatCard label="Awaiting confirmation" value={String(awaitingConfirmation)} detail="Visits still in scheduled status" />
          <StatCard label="Completed visits" value={String(completed)} detail="Closed appointments for this provider" />
        </div>
        <SectionCard title="Provider appointment schedule" description={`Manage confirmations and visit outcomes for Dr. ${provider.first_name} ${provider.last_name}.`}>
          {appointments.length === 0 ? (
            <EmptyState title="No scheduled visits" body="Appointments will appear here as soon as patients book against this provider." />
          ) : (
            <div className="grid gap-3">
              {appointments.map((appointment) => {
                const isTerminal = appointment.status === "completed" || appointment.status === "cancelled";
                const patientName = appointment.profile?.full_name ?? appointment.patient?.patient_mrn ?? "Patient";

                return (
                  <div key={appointment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{appointment.reason}</p>
                        <p className="text-sm text-slate-400">{patientName}</p>
                      </div>
                      <StatusBadge value={appointment.status} />
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                      <p>When: <span className="text-white">{formatDateTime(appointment.scheduled_at)}</span></p>
                      <p>Type: <span className="text-white capitalize">{appointment.appointment_type.replaceAll("_", " ")}</span></p>
                      <p>Duration: <span className="text-white">{appointment.duration_minutes} minutes</span></p>
                      <p>MRN: <span className="text-white">{appointment.patient?.patient_mrn ?? "Unavailable"}</span></p>
                    </div>
                    {appointment.notes ? (
                      <p className="mt-3 text-sm text-slate-300">Notes: <span className="text-white">{appointment.notes}</span></p>
                    ) : null}
                    <div className="mt-4 grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)] xl:items-start">
                      <Link href={`/care-team/patients/${appointment.patient_id}`} className="rounded-2xl border border-white/10 px-4 py-3 text-sm transition hover:border-cyan-400 hover:text-cyan-200">Open patient chart</Link>
                      {isTerminal ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">
                          This appointment is already marked <span className="text-white">{appointment.status}</span>.
                        </div>
                      ) : (
                        <ProviderAppointmentStatusForm appointmentId={appointment.id} currentStatus={appointment.status} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </PortalShell>
  );
}