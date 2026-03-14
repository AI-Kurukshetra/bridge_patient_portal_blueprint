import { MessageComposer } from "@/components/forms/message-form";
import { EmptyState, SectionCard } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";
import { messageSchema } from "@/lib/validations/message";

export default async function MessagingPage() {
  const data = await getPortalData();
  if (!data) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Compose secure message" description="Start a new patient communication thread.">
        <MessageComposer />
      </SectionCard>
      <SectionCard title="Inbox" description="Existing secure conversations, thread history, and patient replies.">
        <div className="grid gap-4">
          {data.conversations.length === 0 ? (
            <EmptyState title="No messages" body="New messages appear here after you contact your care team." />
          ) : (
            data.conversations.map((thread) => {
              const parsedCategory = messageSchema.shape.category.safeParse(thread.category);
              const threadCategory = parsedCategory.success ? parsedCategory.data : "general";

              return (
                <div key={thread.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">{thread.subject}</p>
                  <p className="mt-1 text-sm text-slate-400 capitalize">{thread.category.replaceAll("_", " ")}</p>
                  <div className="mt-4 grid gap-3">
                    {thread.messages.map((message) => (
                      <div key={message.id} className="rounded-2xl bg-slate-950/80 p-3">
                        <p className="text-sm text-slate-200">{message.body}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatDateTime(message.created_at)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="mb-3 text-sm font-medium text-slate-200">Reply in this thread</p>
                    <MessageComposer
                      category={threadCategory}
                      conversationId={thread.id}
                      subject={thread.subject}
                      submitLabel="Reply to thread"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}
