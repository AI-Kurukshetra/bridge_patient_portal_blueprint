"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAppointmentAction } from "@/lib/actions/appointments";
import { appointmentSchema, type AppointmentInput } from "@/lib/validations/appointment";
import type { Row } from "@/types/database";
import { FormError } from "@/components/ui/primitives";

export function AppointmentForm({ providers }: { providers: Row<"providers">[] }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointmentType: "follow_up",
      durationMinutes: 30,
      notes: "",
      location: "",
      scheduledAt: "",
      reason: "",
      providerId: providers[0]?.id ?? "550e8400-e29b-41d4-a716-446655440000",
    },
  });

  const onSubmit = (values: AppointmentInput) => {
    startTransition(async () => {
      const result = await createAppointmentAction(values);
      if (result.error) {
        toast.error(result.error._form?.[0] ?? "Unable to schedule");
        return;
      }
      toast.success(result.message ?? "Scheduled");
      form.reset({ ...values, reason: "", notes: "", location: "" });
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm text-slate-200"><span>Provider</span><select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("providerId")}>{providers.map((provider) => <option key={provider.id} value={provider.id}>Dr. {provider.first_name} {provider.last_name} • {provider.specialty}</option>)}</select></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Type</span><select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("appointmentType")}><option value="follow_up">Follow up</option><option value="annual">Annual</option><option value="telehealth">Telehealth</option><option value="in_person">In person</option><option value="lab">Lab</option><option value="imaging">Imaging</option></select></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Date and time</span><input type="datetime-local" className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("scheduledAt")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Duration (minutes)</span><input type="number" className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("durationMinutes", { valueAsNumber: true })} /></label>
      <label className="grid gap-2 text-sm text-slate-200 md:col-span-2"><span>Reason</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("reason")} /><FormError message={form.formState.errors.reason?.message} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Location note</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("location")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Notes</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("notes")} /></label>
      <div className="md:col-span-2"><button type="submit" disabled={isPending} className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">{isPending ? "Scheduling..." : "Schedule appointment"}</button></div>
    </form>
  );
}

