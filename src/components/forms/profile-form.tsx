"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProfileAction } from "@/lib/actions/profile";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { FormError } from "@/components/ui/primitives";

export function ProfileForm({ initialValues }: { initialValues: ProfileInput }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: initialValues });

  const numberFieldOptions = {
    setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
  };

  const onSubmit = (values: ProfileInput) => {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.error) {
        toast.error(result.error._form?.[0] ?? "Unable to save profile");
        return;
      }
      toast.success(result.message ?? "Profile updated");
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm text-slate-200"><span>Full name</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("fullName")} /><FormError message={form.formState.errors.fullName?.message} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Phone</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("phone")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Date of birth</span><input type="date" className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("dateOfBirth")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Gender</span><select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("gender")}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Preferred language</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("preferredLang")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Timezone</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("timezone")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Blood type</span><select className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("bloodType")}><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Height (cm)</span><input type="number" className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("heightCm", numberFieldOptions)} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Weight (kg)</span><input type="number" className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("weightKg", numberFieldOptions)} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Emergency contact</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("emergencyContactName")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Emergency phone</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("emergencyContactPhone")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Emergency relationship</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("emergencyContactRel")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Preferred pharmacy</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("preferredPharmacy")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Insurance provider</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("insuranceProvider")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Policy number</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("insurancePolicyNo")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Group number</span><input className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("insuranceGroupNo")} /></label>
      <label className="grid gap-2 text-sm text-slate-200"><span>Insurance valid until</span><input type="date" className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" {...form.register("insuranceValidUntil")} /></label>
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 md:col-span-2"><label className="flex items-center justify-between gap-3"><span>MFA reminders enabled</span><input type="checkbox" {...form.register("isMfaEnabled")} /></label><label className="flex items-center justify-between gap-3"><span>Advance directive on file</span><input type="checkbox" {...form.register("advanceDirective")} /></label><label className="flex items-center justify-between gap-3"><span>Organ donor</span><input type="checkbox" {...form.register("organDonor")} /></label></div>
      <div className="md:col-span-2"><button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{isPending ? "Saving..." : "Save profile"}</button></div>
    </form>
  );
}

