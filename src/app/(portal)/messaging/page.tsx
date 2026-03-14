import { MessageComposer } from "@/components/forms/message-form";
import { EmptyState, SectionCard } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";

export default async function MessagingPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Compose secure message" description="Start a new patient communication thread.">
        <MessageComposer />
      </SectionCard>
      <SectionCard title="Inbox" description="Existing secure conversations and thread history.">
        <div className="grid gap-4">
          {data.conversations.length === 0 ? <EmptyState title="No messages" body="New messages appear here after you contact your care team." /> : data.conversations.map((thread) => (
            <div key={thread.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-medium text-white">{thread.subject}</p><p className="mt-1 text-sm text-slate-400 capitalize">{thread.category.replaceAll("_", " ")}</p><div className="mt-4 grid gap-3">{thread.messages.map((message) => <div key={message.id} className="rounded-2xl bg-slate-950/80 p-3"><p className="text-sm text-slate-200">{message.body}</p><p className="mt-2 text-xs text-slate-500">{formatDateTime(message.created_at)}</p></div>)}</div></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

