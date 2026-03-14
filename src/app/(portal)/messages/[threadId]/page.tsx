import { notFound } from "next/navigation";
import { MessageComposer } from "@/components/forms/message-form";
import { SectionCard } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { getPortalData } from "@/lib/queries/portal";
import { messageSchema } from "@/lib/validations/message";

export default async function MessageThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const data = await getPortalData();
  if (!data) return null;

  const thread = data.conversations.find((item) => item.id === threadId);
  if (!thread) notFound();

  const parsedCategory = messageSchema.shape.category.safeParse(thread.category);
  const category = parsedCategory.success ? parsedCategory.data : "general";

  return (
    <SectionCard title={thread.subject} description="Secure thread detail.">
      <div className="grid gap-3">
        {thread.messages.map((message) => (
          <div key={message.id} className="rounded-2xl bg-white/5 p-4"><p className="text-sm text-slate-200">{message.body}</p><p className="mt-2 text-xs text-slate-500">{formatDateTime(message.created_at)}</p></div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-200">Reply in this thread</p>
        <MessageComposer conversationId={thread.id} subject={thread.subject} category={category} submitLabel="Reply to thread" />
      </div>
    </SectionCard>
  );
}
