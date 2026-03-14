import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { SectionCard, StatCard } from "@/components/ui/primitives";

export default function AdminDemoPage() {
  return (
    <PortalShell profileName="Maya Admin" roleLabel="Platform Admin" subtitle="Demo administration workspace" variant="admin">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Demo route</p>
            <h2 className="font-serif text-4xl text-white">Admin experience</h2>
            <p className="mt-2 max-w-3xl text-slate-300">Use this route for recording the administration panel without requiring live admin sign-in.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/demo/patient" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">Patient demo</Link>
            <Link href="/demo/provider" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-300 hover:text-cyan-100">Provider demo</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Profiles" value="128" detail="Total authenticated profiles" />
          <StatCard label="Patients" value="84" detail="Patient records in the portal" />
          <StatCard label="Providers" value="19" detail="Provider directory entries" />
          <StatCard label="Appointments" value="246" detail="Scheduled and historical visits" />
          <StatCard label="Audit logs" value="912" detail="Tracked PHI access events" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SectionCard title="Administration workspace" description="Operational and governance visibility across the platform.">
            <div className="grid gap-3 text-sm text-slate-300">
              <p>Role: <span className="text-white">admin</span></p>
              <p>Email: <span className="text-white">maya.admin.demo@medconnect.app</span></p>
              <p>This workspace is intended for platform oversight, governance, and operational review.</p>
            </div>
          </SectionCard>

          <SectionCard title="Recording notes" description="What to emphasize in the admin walkthrough.">
            <div className="grid gap-3 text-sm text-slate-300">
              <p>Call out role separation across patient, provider, and admin panels.</p>
              <p>Emphasize visibility into profiles, providers, appointments, and audit activity.</p>
              <p>Use this as the closing panel in the full system recording.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
