"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginAction, registerAction } from "@/lib/actions/auth";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth";
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
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Input label="Email address" type="email" placeholder="you@medconnect.app" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Input label="Password" type="password" placeholder="Enter your password" error={form.formState.errors.password?.message} {...form.register("password")} />
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
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" } });

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
      if (result.message?.includes("Redirecting")) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Input label="Full name" placeholder="Jane Patient" error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
      <Input label="Email address" type="email" placeholder="jane@medconnect.app" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Input label="Password" type="password" placeholder="Create a password" error={form.formState.errors.password?.message} {...form.register("password")} />
      <Input label="Confirm password" type="password" placeholder="Confirm your password" error={form.formState.errors.confirmPassword?.message} {...form.register("confirmPassword")} />
      <FormError message={formError} />
      <button type="submit" disabled={isPending} className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

