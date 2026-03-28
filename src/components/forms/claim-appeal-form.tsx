"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { requestClaimAppealAction } from "@/lib/actions/insurance";
import { claimAppealSchema, type ClaimAppealInput } from "@/lib/validations/insurance";
import { FieldHint, FormError } from "@/components/ui/primitives";

export function ClaimAppealForm({ claimId }: { claimId: string }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const form = useForm<ClaimAppealInput>({
    resolver: zodResolver(claimAppealSchema),
    defaultValues: { claimId, appealReason: "" },
  });

  const onSubmit = (values: ClaimAppealInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await requestClaimAppealAction(values);
      if (result.error) {
        const message = result.error._form?.[0] ?? "Unable to submit appeal";
        setFormError(message);
        toast.error(message);
        return;
      }

      toast.success(result.message ?? "Appeal submitted");
      form.reset({ claimId, appealReason: "" });
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
      <input type="hidden" {...form.register("claimId")} />
      <label className="grid gap-2 text-sm text-slate-200">
        <span>Appeal reason</span>
        <textarea rows={4} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Explain why the denial should be reconsidered" {...form.register("appealReason")} />
        <FormError message={form.formState.errors.appealReason?.message} />
      </label>
      <FieldHint>Describe the coverage issue or updated clinical need. Upload supporting documents from the document center if needed.</FieldHint>
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
        {isPending ? "Submitting appeal..." : "Request appeal review"}
      </button>
    </form>
  );
}