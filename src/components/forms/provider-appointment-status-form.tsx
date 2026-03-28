"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProviderAppointmentStatusAction } from "@/lib/actions/appointments";
import {
  providerAppointmentStatusSchema,
  type ProviderAppointmentStatusInput,
} from "@/lib/validations/appointment";
import { FieldHint, FormError } from "@/components/ui/primitives";

function getDefaultStatus(currentStatus: string): ProviderAppointmentStatusInput["status"] {
  if (currentStatus === "confirmed") {
    return "completed";
  }

  return "confirmed";
}

export function ProviderAppointmentStatusForm({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const form = useForm<ProviderAppointmentStatusInput>({
    resolver: zodResolver(providerAppointmentStatusSchema),
    defaultValues: {
      status: getDefaultStatus(currentStatus),
    },
  });

  const onSubmit = (values: ProviderAppointmentStatusInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await updateProviderAppointmentStatusAction(appointmentId, values);
      if (result.error) {
        const message = result.error._form?.[0] ?? "Unable to update appointment";
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success(result.message ?? "Appointment updated");
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <label className="grid gap-2 text-sm text-slate-200">
          <span>Update status</span>
          <select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("status")}>
            <option value="confirmed">Confirm appointment</option>
            <option value="completed">Mark completed</option>
            <option value="cancelled">Cancel appointment</option>
          </select>
        </label>
        <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
          {isPending ? "Updating..." : "Update"}
        </button>
      </div>
      <FieldHint>Provider status updates trigger a patient-facing portal notification.</FieldHint>
      <FormError message={form.formState.errors.status?.message ?? formError} />
    </form>
  );
}