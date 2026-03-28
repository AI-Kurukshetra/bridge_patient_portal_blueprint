"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { sendMessageAction } from "@/lib/actions/messaging";
import { messageSchema, type MessageInput } from "@/lib/validations/message";
import { FormError } from "@/components/ui/primitives";

type MessageComposerProps = {
  category?: MessageInput["category"];
  conversationId?: string;
  subject?: string;
  submitLabel?: string;
};

export function MessageComposer({
  category = "general",
  conversationId,
  subject = "",
  submitLabel = "Send secure message",
}: MessageComposerProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const form = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: "", category, conversationId, subject },
  });

  const isReply = Boolean(conversationId);

  const onSubmit = (values: MessageInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await sendMessageAction(values);
      if (result.error) {
        setFormError(result.error._form?.[0] ?? "Unable to send message");
        toast.error(result.error._form?.[0] ?? "Unable to send message");
        return;
      }
      toast.success(result.message ?? "Message sent");
      form.reset({
        body: "",
        category: values.category,
        conversationId: values.conversationId,
        subject: values.subject,
      });
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      {!isReply ? (
        <>
          <label className="grid gap-2 text-sm text-slate-200">
            <span>Subject</span>
            <input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Subject" {...form.register("subject")} />
            <FormError message={form.formState.errors.subject?.message} />
          </label>
          <label className="grid gap-2 text-sm text-slate-200">
            <span>Category</span>
            <select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("category")}>
              <option value="general">General</option>
              <option value="appointment">Appointment</option>
              <option value="lab_result">Lab result</option>
              <option value="billing">Billing</option>
              <option value="prescription">Prescription</option>
              <option value="care_plan">Care plan</option>
            </select>
            <FormError message={form.formState.errors.category?.message} />
          </label>
        </>
      ) : null}
      <label className="grid gap-2 text-sm text-slate-200">
        <span>{isReply ? "Reply" : "Message"}</span>
        <textarea rows={isReply ? 4 : 5} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder={isReply ? "Write your reply" : "Write your message"} {...form.register("body")} />
        <FormError message={form.formState.errors.body?.message} />
      </label>
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{isPending ? "Sending..." : submitLabel}</button>
    </form>
  );
}
