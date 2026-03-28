import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/utils";

const activities = [
  { title: "Cardiology visit confirmed", detail: "Follow-up appointment with Dr. Sharma confirmed for Mar 18 at 10:30 AM." },
  { title: "Lab panel posted", detail: "Comprehensive metabolic panel and A1C results are now available in the chart." },
  { title: "Insurance claim updated", detail: "Claim CLM-40218 moved to under review with the payer." },
];

const appointments = [
  { reason: "Cardiology follow-up", status: "confirmed", when: "Mar 18, 2026 at 10:30 AM" },
  { reason: "Annual wellness visit", status: "scheduled", when: "Apr 4, 2026 at 9:00 AM" },
];

const careTeam = [
  { name: "Dr. Priya Sharma", specialty: "Internal Medicine", next: "Mar 18, 2026" },
  { name: "Dr. Kavita Reddy", specialty: "Endocrinology", next: "Apr 4, 2026" },
];

const claims = [
  { claim: "CLM-40218", service: "Cardiology consultation", status: "under_review", balance: 4200 },
  { claim: "CLM-39811", service: "Laboratory panel", status: "partially_approved", balance: 1800 },
];

export default function PatientDemoPage() {
  return (
    <PortalShell profileName="Aarav Patient" roleLabel="Patient" subtitle="Demo patient portal" variant="patient">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Demo route</p>
            <h2 className="font-serif text-4xl text-white">Patient experience</h2>
            <p className="mt-2 max-w-3xl text-slate-300">Use this route for recording a clean patient walkthrough without authentication steps.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/demo/provider" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">Provider demo</Link>
            <Link href="/demo/admin" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">Admin demo</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Upcoming appointments" value="2" detail="Confirmed and scheduled visits" />
          <StatCard label="Unread notifications" value="4" detail="Actionable alerts across care and billing" />
          <StatCard label="Open balance" value={formatCurrency(9600)} detail="Current outstanding patient balance" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard title="Recent activity" description="Live portal events across scheduling, labs, and insurance.">
            <div className="grid gap-3">
              {activities.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Next appointments" description="Patient schedule snapshot.">
            <div className="grid gap-3">
              {appointments.map((item) => (
                <div key={item.reason} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.reason}</p>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.when}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <SectionCard title="Electronic health record viewer" description="Longitudinal record summary for demo capture.">
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Diagnoses and allergies</p>
                <p className="mt-2">Hypertension, Type 2 diabetes, and a documented penicillin allergy are visible in one chart view.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Medications and labs</p>
                <p className="mt-2">Medication history and abnormal lab trends are surfaced alongside provider context.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Care team directory" description="Connected providers and upcoming visits.">
            <div className="grid gap-3">
              {careTeam.map((item) => (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="mt-2">{item.specialty}</p>
                  <p className="mt-1 text-slate-500">Next visit {item.next}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Insurance and export" description="Claims visibility and interoperability workflows.">
            <div className="grid gap-3">
              {claims.map((item) => (
                <div key={item.claim} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.claim}</p>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-2">{item.service}</p>
                  <p className="mt-2 text-slate-500">Patient responsibility {formatCurrency(item.balance)}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-slate-200">
                Export formats available: PDF, CSV, and FHIR JSON.
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
