"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { requestHealthDataExportAction } from "@/lib/actions/export";
import {
  healthDataExportSchema,
  type HealthDataExportInput,
} from "@/lib/validations/export";
import { FieldHint, FormError } from "@/components/ui/primitives";

const defaultValues: HealthDataExportInput = {
  format: "pdf",
  includeProfile: true,
  includeAppointments: true,
  includeClinicalHistory: true,
  includeLabResults: true,
  includeMedications: true,
  includeDocuments: false,
  includeConsents: false,
};

const exportFormats: { value: HealthDataExportInput["format"]; label: string; description: string }[] = [
  {
    value: "pdf",
    label: "PDF summary",
    description: "Readable clinical summary for sharing and offline storage.",
  },
  {
    value: "csv",
    label: "CSV timeline",
    description: "Flat export for spreadsheets, reporting, and downstream analytics.",
  },
  {
    value: "fhir_json",
    label: "FHIR JSON",
    description: "Structured interoperability bundle for standards-based exchange.",
  },
];

const exportSections: { key: keyof Omit<HealthDataExportInput, "format">; label: string; description: string }[] = [
  { key: "includeProfile", label: "Profile and coverage", description: "Demographics, emergency contacts, and insurance data." },
  { key: "includeAppointments", label: "Appointments", description: "Scheduled, confirmed, completed, and cancelled visits." },
  { key: "includeClinicalHistory", label: "Clinical history", description: "Conditions, allergies, procedures, and immunizations." },
  { key: "includeLabResults", label: "Lab results", description: "Structured observations and diagnostic reports." },
  { key: "includeMedications", label: "Medications", description: "Medication history and refill-related data." },
  { key: "includeDocuments", label: "Documents", description: "Uploaded files and generated patient records." },
  { key: "includeConsents", label: "Consents", description: "Data sharing and privacy consent preferences." },
];

export function HealthExportForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const form = useForm<HealthDataExportInput>({
    resolver: zodResolver(healthDataExportSchema),
    defaultValues,
  });

  const onSubmit = (values: HealthDataExportInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await requestHealthDataExportAction(values);
      if (result.error) {
        const message = result.error._form?.[0] ?? "Unable to prepare health export.";
        setFormError(message);
        toast.error(message);
        return;
      }

      if (!result.data?.downloadUrl) {
        setFormError("Export download URL was not generated.");
        toast.error("Export download URL was not generated.");
        return;
      }

      toast.success(result.message ?? "Export is ready.");
      window.location.assign(result.data.downloadUrl);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-3">
        <div>
          <p className="text-sm font-medium text-white">Choose export format</p>
          <p className="mt-1 text-sm text-slate-400">Every export is regenerated on demand and audited for traceability.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {exportFormats.map((format) => (
            <label key={format.value} className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5">
              <div className="flex items-center gap-3">
                <input type="radio" value={format.value} className="h-4 w-4 accent-cyan-400" {...form.register("format")} />
                <span className="font-medium text-white">{format.label}</span>
              </div>
              <p className="text-sm text-slate-400">{format.description}</p>
            </label>
          ))}
        </div>
        <FormError message={form.formState.errors.format?.message} />
      </div>

      <div className="grid gap-3">
        <div>
          <p className="text-sm font-medium text-white">Select export sections</p>
          <p className="mt-1 text-sm text-slate-400">Choose the patient record domains that should be included in the download.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {exportSections.map((section) => (
            <label key={section.key} className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 accent-cyan-400" {...form.register(section.key)} />
              <div>
                <p className="font-medium text-white">{section.label}</p>
                <p className="mt-1 text-sm text-slate-400">{section.description}</p>
              </div>
            </label>
          ))}
        </div>
        <FormError message={form.formState.errors.includeProfile?.message} />
        <FieldHint>FHIR JSON always includes a base Patient resource so downstream systems can resolve the record subject.</FieldHint>
      </div>

      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
        {isPending ? "Preparing export..." : "Download health data"}
      </button>
    </form>
  );
}