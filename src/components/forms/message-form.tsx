"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { sendMessageAction } from "@/lib/actions/messaging";
import { messageSchema, type MessageInput } from "@/lib/validations/message";

export function MessageComposer() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: { subject: "", category: "general", body: "" },
  });

  const onSubmit = (values: MessageInput) => {
    startTransition(async () => {
      const result = await sendMessageAction(values);
      if (result.error) {
        toast.error(result.error._form?.[0] ?? "Unable to send message");
        return;
      }
      toast.success(result.message ?? "Message sent");
      form.reset({ subject: "", category: "general", body: "" });
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Subject" {...form.register("subject")} />
      <select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("category")}>
        <option value="general">General</option><option value="appointment">Appointment</option><option value="lab_result">Lab result</option><option value="billing">Billing</option><option value="prescription">Prescription</option><option value="care_plan">Care plan</option>
      </select>
      <textarea rows={5} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Write your message" {...form.register("body")} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{isPending ? "Sending..." : "Send secure message"}</button>
    </form>
  );
}

