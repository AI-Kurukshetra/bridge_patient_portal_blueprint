import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { getRoleLabel } from "@/lib/auth/roles";
import { getProviderPatientDirectory } from "@/lib/queries/patient-chart";
import { formatDateTime } from "@/lib/utils";

export default async function CareTeamPatientsPage() {
  const { auth, provider, patients } = await getProviderPatientDirectory();

  return (
    <PortalShell profileName={auth.profile.full_name} roleLabel={getRoleLabel(auth.role)} subtitle="Care team workspace" variant="provider">
      <SectionCard title="Patient charts" description="Role-authorized access to charts for your assigned or clinically related patients.">
        {!provider ? (
          <EmptyState title="Provider profile setup required" body="Link this account to a provider record to unlock chart access." />
        ) : patients.length === 0 ? (
          <EmptyState title="No assigned patients" body="Patients will appear here once appointments or provider assignments exist." />
        ) : (
          <div className="grid gap-3">
            {patients.map((entry) => (
              <Link key={entry.patient.id} href={`/care-team/patients/${entry.patient.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{entry.profile?.full_name ?? entry.patient.patient_mrn}</p>
                    <p className="text-sm text-slate-400">MRN {entry.patient.patient_mrn}</p>
                  </div>
                  <StatusBadge value={entry.nextAppointment ? entry.nextAppointment.status : "active"} />
                </div>
                <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                  <p>Next appointment: <span className="text-white">{entry.nextAppointment ? formatDateTime(entry.nextAppointment.scheduled_at) : "None scheduled"}</span></p>
                  <p>Last visit: <span className="text-white">{entry.lastAppointment ? formatDateTime(entry.lastAppointment.scheduled_at) : "No prior visit"}</span></p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}