import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { EmptyState, SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";

const schedule = [
  { patient: "Aarav Patient", reason: "Cardiology follow-up", when: "Mar 18, 2026 at 10:30 AM", status: "scheduled" },
  { patient: "Neha Verma", reason: "Medication review", when: "Mar 18, 2026 at 1:00 PM", status: "confirmed" },
  { patient: "Rohan Mehta", reason: "Lab review", when: "Mar 19, 2026 at 9:30 AM", status: "completed" },
];

const patients = [
  { name: "Aarav Patient", mrn: "MRN-200145", next: "Mar 18, 2026 at 10:30 AM" },
  { name: "Neha Verma", mrn: "MRN-200152", next: "Mar 18, 2026 at 1:00 PM" },
  { name: "Rohan Mehta", mrn: "MRN-200163", next: "Open chart access" },
];

export default function ProviderDemoPage() {
  return (
    <PortalShell profileName="Dr. Priya Sharma" roleLabel="Care Team" subtitle="Demo provider workspace" variant="provider">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Demo route</p>
            <h2 className="font-serif text-4xl text-white">Provider experience</h2>
            <p className="mt-2 max-w-3xl text-slate-300">Use this route for recording the provider panel without needing live provider-account linkage.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/demo/patient" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">Patient demo</Link>
            <Link href="/demo/admin" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">Admin demo</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Upcoming appointments" value="6" detail="Visits assigned to this provider" />
          <StatCard label="Needs confirmation" value="2" detail="Scheduled visits awaiting action" />
          <StatCard label="Lab observations" value="18" detail="Recent observations attached to authored panels" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="Provider appointment schedule" description="Operational care coordination and visit status management.">
            <div className="grid gap-3">
              {schedule.map((item) => (
                <div key={`${item.patient}-${item.when}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.reason}</p>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.when}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.patient}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Role authorization" description="Provider-only clinical workspace.">
            <div className="grid gap-3 text-sm text-slate-300">
              <p>Role: <span className="text-white">provider</span></p>
              <p>Provider: <span className="text-white">Dr. Priya Sharma</span></p>
              <p>Email: <span className="text-white">dr.sharma@cityhospital.com</span></p>
              <p>This workspace is intentionally separated from patient and admin panels.</p>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Patient chart directory" description="Role-authorized charts linked through appointments and clinical relationships.">
          <div className="grid gap-3 md:grid-cols-3">
            {patients.map((item) => (
              <div key={item.mrn} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5">
                <p className="font-medium text-white">{item.name}</p>
                <p className="mt-2 text-sm text-slate-300">{item.mrn}</p>
                <p className="mt-1 text-sm text-slate-500">{item.next}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title="Electronic health record viewer" description="Clinical longitudinal chart for provider review.">
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Clinical timeline</p>
                <p className="mt-2">Providers can review diagnoses, procedures, medications, and lab events in one unified chart.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Lab trends</p>
                <p className="mt-2">Recent observations are grouped for fast review and care follow-up.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Care context</p>
                <p className="mt-2">Access is limited to valid provider-patient relationships, not broad unrestricted chart visibility.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Operational notes" description="Useful talking points while recording.">
            <div className="grid gap-3 text-sm text-slate-300">
              <p>Highlight the difference between the provider dashboard and the patient portal.</p>
              <p>Show that patient access appears as a clinical directory, not as self-service personal records.</p>
              <p>Mention role-based routing and authorized chart visibility.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
