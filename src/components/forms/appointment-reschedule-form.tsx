"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { rescheduleAppointmentAction } from "@/lib/actions/appointments";
import {
  appointmentRescheduleSchema,
  type AppointmentRescheduleInput,
} from "@/lib/validations/appointment";
import { FieldHint, FormError } from "@/components/ui/primitives";

function toDateTimeInputValue(value: string | Date) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getMinimumScheduleTime() {
  const minimumDate = new Date();
  minimumDate.setMinutes(minimumDate.getMinutes() + 15, 0, 0);
  return toDateTimeInputValue(minimumDate);
}

type AppointmentRescheduleFormProps = {
  appointmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  notes: string | null;
};

export function AppointmentRescheduleForm({
  appointmentId,
  scheduledAt,
  durationMinutes,
  location,
  notes,
}: AppointmentRescheduleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const minimumScheduleTime = getMinimumScheduleTime();
  const form = useForm<AppointmentRescheduleInput>({
    resolver: zodResolver(appointmentRescheduleSchema),
    defaultValues: {
      durationMinutes,
      location: location ?? "",
      notes: notes ?? "",
      scheduledAt: toDateTimeInputValue(scheduledAt),
    },
  });

  const onSubmit = (values: AppointmentRescheduleInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await rescheduleAppointmentAction(appointmentId, values);
      if (result.error) {
        const message = result.error._form?.[0] ?? "Unable to reschedule";
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success(result.message ?? "Appointment rescheduled");
      form.reset(values);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <label className="grid gap-2 text-sm text-slate-200">
        <span>New date and time</span>
        <input type="datetime-local" min={minimumScheduleTime} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("scheduledAt")} />
        <FormError message={form.formState.errors.scheduledAt?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Duration (minutes)</span>
        <input type="number" min={15} max={120} step={15} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("durationMinutes", { valueAsNumber: true })} />
        <FormError message={form.formState.errors.durationMinutes?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Location note</span>
        <input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("location")} />
        <FormError message={form.formState.errors.location?.message} />
      </label>
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Notes</span>
        <textarea rows={4} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("notes")} />
        <FormError message={form.formState.errors.notes?.message} />
      </label>
      <FieldHint>Rescheduling moves the visit back to a scheduled state so the care team can review it.</FieldHint>
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
        {isPending ? "Updating..." : "Reschedule appointment"}
      </button>
    </form>
  );
}