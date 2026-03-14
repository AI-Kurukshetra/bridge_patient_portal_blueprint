"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createDocumentAction } from "@/lib/actions/documents";
import {
  documentUploadSchema,
  type DocumentUploadInput,
} from "@/lib/validations/document";
import { FieldHint, FormError } from "@/components/ui/primitives";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

export function DocumentForm() {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [fileInputKey, setFileInputKey] = useState(0);

  const form = useForm<DocumentUploadInput>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      title: "",
      category: "other",
    },
  });

  const onSubmit = (values: DocumentUploadInput) => {
    startTransition(async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData.user;

      if (authError || !user) {
        toast.error(authError?.message ?? "You must be signed in to upload a document");
        return;
      }

      const extensionSafeName = sanitizeFileName(values.file.name);
      const storagePath = `${user.id}/${Date.now()}-${extensionSafeName}`;

      const upload = await supabase.storage
        .from("patient-documents")
        .upload(storagePath, values.file, {
          cacheControl: "3600",
          contentType: values.file.type || undefined,
          upsert: false,
        });

      if (upload.error) {
        toast.error(upload.error.message);
        return;
      }

      const result = await createDocumentAction({
        title: values.title,
        category: values.category,
        storagePath,
        mimeType: values.file.type || "application/octet-stream",
        fileSize: values.file.size,
      });

      if (result.error) {
        await supabase.storage.from("patient-documents").remove([storagePath]);
        toast.error(result.error._form?.[0] ?? "Unable to save document");
        return;
      }

      toast.success(result.message ?? "Document uploaded");
      form.reset({ title: "", category: "other" });
      setFileInputKey((current) => current + 1);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
      <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
        <span>Document title</span>
        <input
          className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white"
          placeholder="MRI summary, insurance card, lab report"
          {...form.register("title")}
        />
        <FormError message={form.formState.errors.title?.message} />
      </label>

      <label className="grid gap-2 text-sm text-slate-200">
        <span>Category</span>
        <select
          className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white"
          {...form.register("category")}
        >
          <option value="insurance">Insurance</option>
          <option value="discharge_summary">Discharge summary</option>
          <option value="lab_report">Lab report</option>
          <option value="imaging">Imaging</option>
          <option value="consent">Consent</option>
          <option value="billing">Billing</option>
          <option value="other">Other</option>
        </select>
        <FormError message={form.formState.errors.category?.message} />
      </label>

      <label className="grid gap-2 text-sm text-slate-200 md:col-span-3">
        <span>Choose file</span>
        <input
          key={fileInputKey}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
          className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 px-4 py-3 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-950"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) {
              form.resetField("file");
              await form.trigger("file");
              return;
            }

            form.setValue("file", file, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }}
        />
        <FieldHint>Supported for this demo: PDF, image, Word, and text files up to 10MB.</FieldHint>
        <FormError message={form.formState.errors.file?.message} />
      </label>

      <div className="md:col-span-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {isPending ? "Uploading..." : "Upload document"}
        </button>
      </div>
    </form>
  );
}
