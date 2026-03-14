import { SectionCard, StatCard, StatusBadge } from "@/components/ui/primitives";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function DashboardPage() {
  const data = await getPortalData();
  if (!data || !data.patient) return null;

  const upcoming = data.appointments.filter((item) => new Date(item.scheduled_at) > new Date()).length;
  const unread = data.notifications.filter((item) => !item.is_read).length;
  const openInvoices = data.invoices.filter((item) => item.status === "open").reduce((sum, item) => sum + item.amount_cents, 0);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Upcoming appointments" value={String(upcoming)} detail="Confirmed and scheduled visits" />
        <StatCard label="Unread notifications" value={String(unread)} detail="Actionable alerts across clinical and billing workflows" />
        <StatCard label="Open balance" value={formatCurrency(openInvoices)} detail="Current outstanding invoices" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Recent activity" description="Portal events hydrated from Supabase demo data">
          <div className="grid gap-3">
            {data.recentActivities.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{item.title}</p><span className="text-xs text-slate-400">{formatDateTime(item.occurred_at)}</span></div>
                <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Next appointments" description="Your upcoming schedule">
          <div className="grid gap-3">
            {data.appointments.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{item.reason}</p><StatusBadge value={item.status} /></div>
                <p className="mt-2 text-sm text-slate-300">{formatDateTime(item.scheduled_at)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

