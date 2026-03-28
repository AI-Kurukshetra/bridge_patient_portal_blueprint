import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/auth-forms";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 lg:grid-cols-[1fr_0.95fr]">
        <section className="hidden bg-[radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.24),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.88),_rgba(15,23,42,0.98))] p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/75">Password reset</p>
          <h1 className="mt-4 font-serif text-5xl text-white">Set a new secure password.</h1>
          <p className="mt-6 max-w-md text-slate-300">Use a strong password that meets the platform security policy before returning to the patient portal.</p>
        </section>
        <section className="p-8 sm:p-10">
          <h2 className="font-serif text-4xl text-white">Reset password</h2>
          <p className="mt-2 text-sm text-slate-400">This page requires a valid recovery session from your email link.</p>
          <div className="mt-8"><ResetPasswordForm /></div>
          <p className="mt-6 text-sm text-slate-400">Need a new link? <Link href="/forgot-password" className="text-cyan-300 transition hover:text-cyan-200">Request password reset</Link></p>
        </section>
      </div>
    </main>
  );
}
