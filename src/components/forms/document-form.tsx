"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createDocumentAction } from "@/lib/actions/documents";
import { documentSchema, type DocumentInput } from "@/lib/validations/document";

export function DocumentForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<DocumentInput>({ resolver: zodResolver(documentSchema), defaultValues: { title: "", category: "other", mimeType: "application/pdf", fileSize: 0 } });

  const onSubmit = (values: DocumentInput) => {
    startTransition(async () => {
      const result = await createDocumentAction(values);
      if (result.error) {
        toast.error(result.error._form?.[0] ?? "Unable to save document");
        return;
      }
      toast.success(result.message ?? "Saved");
      form.reset({ title: "", category: "other", mimeType: "application/pdf", fileSize: 0 });
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
      <input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white md:col-span-2" placeholder="Document title" {...form.register("title")} />
      <select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("category")}>
        <option value="insurance">Insurance</option><option value="discharge_summary">Discharge summary</option><option value="lab_report">Lab report</option><option value="imaging">Imaging</option><option value="consent">Consent</option><option value="billing">Billing</option><option value="other">Other</option>
      </select>
      <input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="MIME type" {...form.register("mimeType")} />
      <input type="number" className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="File size" {...form.register("fileSize", { valueAsNumber: true })} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">{isPending ? "Saving..." : "Add document metadata"}</button>
    </form>
  );
}

