import { PortalShell } from "@/components/layout/portal-shell";
import { getRoleLabel } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { SectionCard, StatCard } from "@/components/ui/primitives";

export default async function AdminPage() {
  const auth = await requireRole(["admin"]);
  const supabase = await createClient();

  const [profiles, patients, providers, appointments, auditLogs] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("providers").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
  ]);

  return (
    <PortalShell profileName={auth.profile.full_name} roleLabel={getRoleLabel(auth.role)} subtitle="Administration workspace" variant="admin">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Profiles" value={String(profiles.count ?? 0)} detail="Total authenticated profiles" />
          <StatCard label="Patients" value={String(patients.count ?? 0)} detail="Patient records in the portal" />
          <StatCard label="Providers" value={String(providers.count ?? 0)} detail="Provider directory entries" />
          <StatCard label="Appointments" value={String(appointments.count ?? 0)} detail="Scheduled and historical visits" />
          <StatCard label="Audit logs" value={String(auditLogs.count ?? 0)} detail="Tracked PHI access events" />
        </div>
        <SectionCard title="Role authorization" description="This workspace is restricted to administrator accounts.">
          <div className="grid gap-3 text-sm text-slate-300">
            <p>Role: <span className="text-white">{auth.role}</span></p>
            <p>Email: <span className="text-white">{auth.profile.email}</span></p>
            <p>Use this workspace for governance, operational visibility, and system-level review.</p>
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
