import Link from "next/link";
import { EmptyState, SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { logAudit } from "@/lib/audit";
import { getCurrentPatientChart } from "@/lib/queries/patient-chart";
import { formatDateTime } from "@/lib/utils";

export default async function CareTeamDirectoryPage() {
  const chart = await getCurrentPatientChart();
  if (!chart) return null;

  await logAudit({
    action: "VIEW_CARE_TEAM_DIRECTORY",
    metadata: {
      providers: chart.careTeam.length,
      primaryProviderId: chart.primaryProvider?.id ?? null,
    },
    patientId: chart.patient.id,
    resourceId: chart.patient.id,
    resourceType: "care-team-directory",
  });

  const providerSummaries = chart.careTeam.map((provider) => {
    const nextAppointment = chart.appointments
      .filter((item) => item.provider_id === provider.id && new Date(item.scheduled_at) >= new Date())
      .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime())[0] ?? null;
    const authoredConditions = chart.conditions.filter((item) => item.provider_id === provider.id).length;
    const authoredProcedures = chart.procedures.filter((item) => item.provider_id === provider.id).length;
    const managedMedications = chart.prescriptions.filter((item) => item.provider_id === provider.id).length;
    const managedLabs = chart.labResults.filter((item) => item.provider_id === provider.id).length;

    return {
      provider,
      nextAppointment,
      clinicalTouchpoints: authoredConditions + authoredProcedures + managedMedications + managedLabs,
    };
  });

  const specialists = providerSummaries.filter((entry) => entry.provider.id !== chart.primaryProvider?.id).length;
  const upcomingVisits = providerSummaries.filter((entry) => entry.nextAppointment).length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Care team members" value={String(providerSummaries.length)} detail="Providers linked through assignments, visits, and authored clinical data." />
        <StatCard label="Specialists" value={String(specialists)} detail="Non-primary providers involved in ongoing care." />
        <StatCard label="Upcoming provider visits" value={String(upcomingVisits)} detail="Team members with a scheduled future appointment." />
      </div>

      {providerSummaries.length === 0 ? (
        <SectionCard title="Care team directory" description="Provider details will appear here once appointments or clinical records connect your account to care team members.">
          <EmptyState title="No care team available" body="Assigned providers will appear here after your first scheduled visit or imported clinical record." />
        </SectionCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <SectionCard title="Primary provider" description="Your primary care point of contact and assigned record owner.">
            {chart.primaryProvider ? (
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Primary provider</p>
                    <p className="mt-2 font-serif text-2xl text-white">Dr. {chart.primaryProvider.first_name} {chart.primaryProvider.last_name}</p>
                    <p className="mt-1 text-sm text-slate-200">{chart.primaryProvider.specialty}</p>
                  </div>
                  <StatusBadge value={chart.primaryProvider.accepting_patients ? "active" : "low"} />
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-200">
                  <p>Organization: <span className="text-white">{chart.primaryProvider.organization ?? "Not recorded"}</span></p>
                  <p>Email: <span className="text-white">{chart.primaryProvider.email ?? "Not recorded"}</span></p>
                  <p>Phone: <span className="text-white">{chart.primaryProvider.phone ?? "Not recorded"}</span></p>
                  <p>Languages: <span className="text-white">{chart.primaryProvider.languages?.join(", ") ?? "Not recorded"}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {chart.primaryProvider.email ? (
                    <a href={`mailto:${chart.primaryProvider.email}`} className="rounded-2xl border border-white/10 px-4 py-2 text-sm transition hover:border-cyan-300 hover:text-cyan-100">
                      Email provider
                    </a>
                  ) : null}
                  {chart.primaryProvider.phone ? (
                    <a href={`tel:${chart.primaryProvider.phone}`} className="rounded-2xl border border-white/10 px-4 py-2 text-sm transition hover:border-cyan-300 hover:text-cyan-100">
                      Call office
                    </a>
                  ) : null}
                  <Link href="/messages/compose" className="rounded-2xl border border-white/10 px-4 py-2 text-sm transition hover:border-cyan-300 hover:text-cyan-100">
                    Start secure message
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState title="No primary provider assigned" body="Primary provider information will appear here when connected by your care organization." />
            )}
          </SectionCard>

          <SectionCard title="Care team directory" description="Contact details, specialties, and upcoming visit context for providers connected to your chart.">
            <div className="grid gap-3">
              {providerSummaries.map((entry) => (
                <div key={entry.provider.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">Dr. {entry.provider.first_name} {entry.provider.last_name}</p>
                      <p className="text-sm text-slate-400">{entry.provider.specialty}</p>
                    </div>
                    <StatusBadge value={entry.provider.id === chart.primaryProvider?.id ? "active" : "open"} />
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                    <p>Organization: <span className="text-white">{entry.provider.organization ?? "Not recorded"}</span></p>
                    <p>Department: <span className="text-white">{entry.provider.department ?? "Not recorded"}</span></p>
                    <p>Email: <span className="text-white">{entry.provider.email ?? "Not recorded"}</span></p>
                    <p>Phone: <span className="text-white">{entry.provider.phone ?? "Not recorded"}</span></p>
                    <p>Location: <span className="text-white">{[entry.provider.city, entry.provider.state].filter(Boolean).join(", ") || "Not recorded"}</span></p>
                    <p>Languages: <span className="text-white">{entry.provider.languages?.join(", ") ?? "Not recorded"}</span></p>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-400 md:grid-cols-2">
                    <p>Clinical touchpoints: <span className="text-white">{entry.clinicalTouchpoints}</span></p>
                    <p>Accepting patients: <span className="text-white">{entry.provider.accepting_patients ? "Yes" : "No"}</span></p>
                  </div>
                  {entry.nextAppointment ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">
                      <p className="font-medium text-white">Next appointment</p>
                      <p className="mt-1">{entry.nextAppointment.reason}</p>
                      <p className="mt-1 text-slate-500">{formatDateTime(entry.nextAppointment.scheduled_at)}</p>
                      <Link href={`/appointments/${entry.nextAppointment.id}`} className="mt-3 inline-flex text-sm text-cyan-200 transition hover:text-cyan-100">
                        Open appointment details
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}