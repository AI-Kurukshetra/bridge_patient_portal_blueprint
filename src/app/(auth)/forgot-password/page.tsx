import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 lg:grid-cols-[1fr_0.95fr]">
        <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.88),_rgba(15,23,42,0.98))] p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/75">Recovery</p>
          <h1 className="mt-4 font-serif text-5xl text-white">Recover access to your portal.</h1>
          <p className="mt-6 max-w-md text-slate-300">We will email a one-time recovery link that routes through the auth callback and into your password reset screen.</p>
        </section>
        <section className="p-8 sm:p-10">
          <h2 className="font-serif text-4xl text-white">Forgot password</h2>
          <p className="mt-2 text-sm text-slate-400">Enter the email tied to your MedConnect account.</p>
          <div className="mt-8"><ForgotPasswordForm /></div>
          <p className="mt-6 text-sm text-slate-400">Remembered it? <Link href="/login" className="text-cyan-300 transition hover:text-cyan-200">Back to sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
