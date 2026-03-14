import { PortalShell } from "@/components/layout/portal-shell";
import { getRoleLabel } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
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

  const [appointmentsRes, labsRes, messagesRes] = await Promise.all([
    supabase.from("appointments").select("*").eq("provider_id", provider.id).order("scheduled_at"),
    supabase.from("lab_results").select("*").eq("provider_id", provider.id).order("observed_at", { ascending: false }),
    supabase.from("messages").select("*").eq("sender_id", auth.userId).order("created_at", { ascending: false }),
  ]);

  const appointments = appointmentsRes.data ?? [];
  const labs = labsRes.data ?? [];
  const recentMessages = messagesRes.data ?? [];
  const upcoming = appointments.filter((item) => new Date(item.scheduled_at) > new Date()).length;

  return (
    <PortalShell profileName={auth.profile.full_name} roleLabel={getRoleLabel(auth.role)} subtitle="Care team workspace" variant="provider">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Upcoming appointments" value={String(upcoming)} detail="Visits assigned to this provider" />
          <StatCard label="Lab observations" value={String(labs.length)} detail="Recent observations attached to your panels" />
          <StatCard label="Messages sent" value={String(recentMessages.length)} detail="Secure communication activity" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title="Next appointments" description="Provider view of assigned schedule.">
            <div className="grid gap-3">
              {appointments.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{item.reason}</p><StatusBadge value={item.status} /></div>
                  <p className="mt-2 text-sm text-slate-300">{formatDateTime(item.scheduled_at)}</p>
                </div>
              ))}
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
      </div>
    </PortalShell>
  );
}