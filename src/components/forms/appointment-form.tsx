"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAppointmentAction } from "@/lib/actions/appointments";
import { appointmentSchema, type AppointmentInput } from "@/lib/validations/appointment";
import type { Row } from "@/types/database";
import { FieldHint, FormError } from "@/components/ui/primitives";

function toDateTimeInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getMinimumScheduleTime() {
  const minimumDate = new Date();
  minimumDate.setMinutes(minimumDate.getMinutes() + 15, 0, 0);
  return toDateTimeInputValue(minimumDate);
}

export function AppointmentForm({ providers }: { providers: Row<"providers">[] }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const minimumScheduleTime = getMinimumScheduleTime();
  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointmentType: "follow_up",
      durationMinutes: 30,
      notes: "",
      location: "",
      scheduledAt: "",
      reason: "",
      providerId: providers[0]?.id ?? "",
    },
  });

  const onSubmit = (values: AppointmentInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await createAppointmentAction(values);
      if (result.error) {
        const message = result.error._form?.[0] ?? "Unable to schedule";
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success(result.message ?? "Scheduled");
      form.reset({
        appointmentType: values.appointmentType,
        durationMinutes: values.durationMinutes,
        notes: "",
        location: "",
        providerId: values.providerId,
        reason: "",
        scheduledAt: "",
      });
    });
  };

  const hasProviders = providers.length > 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Provider</span>
        <select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("providerId")}>
          {hasProviders ? null : <option value="">No providers available</option>}
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              Dr. {provider.first_name} {provider.last_name} | {provider.specialty}
            </option>
          ))}
        </select>
        <FormError message={form.formState.errors.providerId?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Type</span>
        <select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("appointmentType")}>
          <option value="follow_up">Follow up</option>
          <option value="annual">Annual</option>
          <option value="telehealth">Telehealth</option>
          <option value="in_person">In person</option>
          <option value="lab">Lab</option>
          <option value="imaging">Imaging</option>
        </select>
        <FormError message={form.formState.errors.appointmentType?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Date and time</span>
        <input type="datetime-local" min={minimumScheduleTime} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("scheduledAt")} />
        <FormError message={form.formState.errors.scheduledAt?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Duration (minutes)</span>
        <input type="number" min={15} max={120} step={15} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("durationMinutes", { valueAsNumber: true })} />
        <FormError message={form.formState.errors.durationMinutes?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
        <span>Reason</span>
        <input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("reason")} />
        <FormError message={form.formState.errors.reason?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Location note</span>
        <input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Clinic preference or onsite note" {...form.register("location")} />
        <FormError message={form.formState.errors.location?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Notes</span>
        <textarea rows={4} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Anything your care team should know before the visit" {...form.register("notes")} />
        <FormError message={form.formState.errors.notes?.message} />
      </label>
      <div className="grid gap-2 md:col-span-2">
        <FormError message={formError} />
        {!hasProviders ? <FieldHint>No provider profiles are available for self-scheduling yet.</FieldHint> : null}
        <button type="submit" disabled={isPending || !hasProviders} className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">
          {isPending ? "Scheduling..." : "Schedule appointment"}
        </button>
      </div>
    </form>
  );
}