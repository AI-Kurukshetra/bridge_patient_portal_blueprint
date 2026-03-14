import Link from "next/link";
import { RegisterForm } from "@/components/forms/auth-forms";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 lg:grid-cols-[1fr_0.95fr]">
        <section className="hidden bg-[radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.24),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.88),_rgba(15,23,42,0.98))] p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/75">Onboarding</p>
          <h1 className="mt-4 font-serif text-5xl text-white">Create a patient account and load demo care data instantly.</h1>
          <p className="mt-6 max-w-md text-slate-300">Signup provisions your profile and patient record in Supabase, then hydrates the portal with sample appointments, labs, billing, and notifications.</p>
        </section>
        <section className="p-8 sm:p-10">
          <h2 className="font-serif text-4xl text-white">Create account</h2>
          <p className="mt-2 text-sm text-slate-400">This uses Supabase Auth with shared client and server validation.</p>
          <div className="mt-8"><RegisterForm /></div>
          <p className="mt-6 text-sm text-slate-400">Already registered? <Link href="/login" className="text-cyan-300 transition hover:text-cyan-200">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}

