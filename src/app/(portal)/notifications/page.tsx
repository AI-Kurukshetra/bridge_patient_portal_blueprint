import { markNotificationReadAction } from "@/lib/actions/portal";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function NotificationsPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <SectionCard title="Notifications center" description="Operational and clinical events that need your attention.">
      <div className="grid gap-3">
        {data.notifications.length === 0 ? <EmptyState title="No notifications" body="You are caught up." /> : data.notifications.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-white">{item.title}</p><p className="text-sm text-slate-300">{item.body}</p></div><StatusBadge value={item.is_read ? "completed" : item.type} /></div><div className="mt-4 flex items-center justify-between"><p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>{!item.is_read ? <form action={async () => { "use server"; await markNotificationReadAction(item.id); }}><button className="rounded-2xl border border-white/10 px-3 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-200">Mark read</button></form> : null}</div></div>
        ))}
      </div>
    </SectionCard>
  );
}

