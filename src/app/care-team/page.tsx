import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { EmptyState, SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { getRoleLabel } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/server";
import { getProviderPatientDirectory } from "@/lib/queries/patient-chart";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export default async function CareTeamPage() {
  const auth = await requireRole(["provider"]);
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .or(`profile_id.eq.${auth.userId},email.eq.${auth.profile.email}`)
    .single();

  if (!provider) {
    return (
      <PortalShell profileName={auth.profile.full_name} roleLabel={getRoleLabel(auth.role)} subtitle="Care team workspace" variant="provider">
        <SectionCard title="Provider profile setup required" description="This account is marked as a provider but is not yet linked to a provider record.">
          <p className="text-sm text-slate-300">Link this profile to a `providers` row using `providers.profile_id` or the same email address to unlock provider-specific data.</p>
        </SectionCard>
      </PortalShell>
    );
  }

  const [appointmentsRes, labsRes, directory] = await Promise.all([
    supabase.from("appointments").select("*").eq("provider_id", provider.id).order("scheduled_at"),
    supabase.from("lab_results").select("*").eq("provider_id", provider.id).order("observed_at", { ascending: false }),
    getProviderPatientDirectory(),
  ]);

  const appointments = appointmentsRes.data ?? [];
  const labs = labsRes.data ?? [];
  const upcoming = appointments.filter((item) => new Date(item.scheduled_at) > new Date() && item.status !== "cancelled").length;
  const pendingConfirmations = appointments.filter((item) => item.status === "scheduled").length;
  const trackedPatients = directory.patients.slice(0, 4);
  const patientNameById = new Map(
    directory.patients.map((entry) => [entry.patient.id, entry.profile?.full_name ?? entry.patient.patient_mrn]),
  );

  return (
    <PortalShell profileName={auth.profile.full_name} roleLabel={getRoleLabel(auth.role)} subtitle="Care team workspace" variant="provider">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Upcoming appointments" value={String(upcoming)} detail="Visits assigned to this provider" />
          <StatCard label="Needs confirmation" value={String(pendingConfirmations)} detail="Scheduled visits awaiting provider action" />
          <StatCard label="Lab observations" value={String(labs.length)} detail="Recent observations attached to your panels" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title="Next appointments" description="Open the full schedule to confirm, complete, or cancel visits.">
            {appointments.length === 0 ? (
              <EmptyState title="No appointments assigned" body="Assigned visits will appear here once patients schedule with this provider." />
            ) : (
              <div className="grid gap-3">
                {appointments.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{item.reason}</p><StatusBadge value={item.status} /></div>
                    <p className="mt-2 text-sm text-slate-300">{formatDateTime(item.scheduled_at)}</p>
                    <p className="mt-1 text-sm text-slate-500">{patientNameById.get(item.patient_id) ?? "Assigned patient"}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/care-team/appointments" className="text-sm text-cyan-200 transition hover:text-cyan-100">Manage full appointment schedule</Link>
            </div>
          </SectionCard>
          <SectionCard title="Role authorization" description="This workspace is restricted to provider accounts.">
            <div className="grid gap-3 text-sm text-slate-300">
              <p>Role: <span className="text-white">{auth.role}</span></p>
              <p>Provider: <span className="text-white">Dr. {provider.first_name} {provider.last_name}</span></p>
              <p>Email: <span className="text-white">{auth.profile.email}</span></p>
            </div>
          </SectionCard>
        </div>
        <SectionCard title="Patient record access" description="Patients available for chart review through assignment, appointments, or authored clinical data.">
          {trackedPatients.length === 0 ? (
            <EmptyState title="No patient charts" body="Patient charts will appear here once this provider is linked to appointments or care assignments." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {trackedPatients.map((entry) => (
                <Link key={entry.patient.id} href={`/care-team/patients/${entry.patient.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5">
                  <p className="font-medium text-white">{entry.profile?.full_name ?? entry.patient.patient_mrn}</p>
                  <p className="mt-2 text-sm text-slate-300">MRN {entry.patient.patient_mrn}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.nextAppointment ? `Next visit ${formatDateTime(entry.nextAppointment.scheduled_at)}` : "Open chart access"}</p>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/care-team/patients" className="text-cyan-200 transition hover:text-cyan-100">Open full patient chart directory</Link>
            <Link href="/care-team/appointments" className="text-cyan-200 transition hover:text-cyan-100">Open provider appointment schedule</Link>
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}