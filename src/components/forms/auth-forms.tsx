"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  updatePasswordAction,
} from "@/lib/actions/auth";
import { registrationRoleOptions } from "@/lib/auth/onboarding-config";
import { cn } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { FormError } from "@/components/ui/primitives";

function Input({ label, type = "text", error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      <span>{label}</span>
      <input {...props} type={type} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
      <FormError message={error} />
    </label>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = (values: LoginInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.error) {
        setFormError(result.error._form?.[0]);
        toast.error(result.error._form?.[0] ?? "Unable to sign in");
        return;
      }
      toast.success("Welcome back");
      router.push(result.data?.redirectTo ?? "/dashboard");
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Input label="Email address" type="email" placeholder="you@medconnect.app" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Input label="Password" type="password" placeholder="Enter your password" error={form.formState.errors.password?.message} {...form.register("password")} />
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-500">Patients, providers, and admins share the same secure sign-in.</span>
        <Link href="/forgot-password" className="text-cyan-300 transition hover:text-cyan-200">Forgot password?</Link>
      </div>
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "patient",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      specialty: "",
      organization: "",
      accessCode: "",
      agreeTerms: true,
    },
  });
  const role = useWatch({ control: form.control, name: "role" });

  const onSubmit = (values: RegisterInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await registerAction(values);
      if (result.error) {
        setFormError(result.error._form?.[0]);
        toast.error(result.error._form?.[0] ?? "Unable to create account");
        return;
      }
      toast.success(result.message ?? "Account created");
      router.push(result.data?.redirectTo ?? "/login");
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm text-slate-200">Account role</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {registrationRoleOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-2xl border px-4 py-4 text-sm transition",
                role === option.value
                  ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white",
              )}
            >
              <input type="radio" value={option.value} className="sr-only" {...form.register("role")} />
              <span className="block font-medium">{option.label}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-400">{option.description}</span>
            </label>
          ))}
        </div>
        <FormError message={form.formState.errors.role?.message} />
      </div>

      <Input label="Full name" placeholder={role === "provider" ? "Dr. Nina Shah" : role === "admin" ? "Alex Admin" : "Jane Patient"} error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
      <Input label="Email address" type="email" placeholder="you@medconnect.app" error={form.formState.errors.email?.message} {...form.register("email")} />

      {role === "provider" ? (
        <Input label="Clinical specialty" placeholder="Cardiology" error={form.formState.errors.specialty?.message} {...form.register("specialty")} />
      ) : null}

      {role !== "patient" ? (
        <>
          <Input label="Organization" placeholder="Bridge Health System" error={form.formState.errors.organization?.message} {...form.register("organization")} />
          <Input label={`${role === "provider" ? "Provider" : "Admin"} access code`} type="password" placeholder="Enter the staff onboarding code" error={form.formState.errors.accessCode?.message} {...form.register("accessCode")} />
          <p className="-mt-2 text-xs text-slate-500">Staff roles are protected with onboarding codes in this demo. Use invite-based provisioning in production.</p>
        </>
      ) : null}

      <Input label="Password" type="password" placeholder="Create a strong password" error={form.formState.errors.password?.message} {...form.register("password")} />
      <p className="-mt-2 text-xs text-slate-500">Use at least 10 characters with an uppercase letter, number, and special character.</p>
      <Input label="Confirm password" type="password" placeholder="Confirm your password" error={form.formState.errors.confirmPassword?.message} {...form.register("confirmPassword")} />
      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950" {...form.register("agreeTerms")} />
        <span>I agree to the Terms of Use and HIPAA notice for this healthcare-interoperability demo.</span>
      </label>
      <FormError message={form.formState.errors.agreeTerms?.message} />
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">
        {isPending ? "Creating account..." : `Create ${role} account`}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);
      if (result.error) {
        setFormError(result.error._form?.[0]);
        toast.error(result.error._form?.[0] ?? "Unable to send password reset email");
        return;
      }
      toast.success(result.message ?? "Password reset email sent");
      form.reset();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Input label="Email address" type="email" placeholder="you@medconnect.app" error={form.formState.errors.email?.message} {...form.register("email")} />
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
        {isPending ? "Sending reset link..." : "Send reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: ResetPasswordInput) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await updatePasswordAction(values);
      if (result.error) {
        setFormError(result.error._form?.[0]);
        toast.error(result.error._form?.[0] ?? "Unable to reset password");
        return;
      }
      toast.success(result.message ?? "Password updated");
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Input label="New password" type="password" placeholder="Create a strong password" error={form.formState.errors.password?.message} {...form.register("password")} />
      <Input label="Confirm new password" type="password" placeholder="Re-enter your password" error={form.formState.errors.confirmPassword?.message} {...form.register("confirmPassword")} />
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">
        {isPending ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}