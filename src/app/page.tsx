import Link from "next/link";
import { ArrowRight, CalendarDays, FlaskConical, ShieldCheck, Stethoscope } from "lucide-react";

const highlights = [
  { title: "Unified health record", body: "Conditions, allergies, procedures, labs, prescriptions, and billing in one authenticated workspace.", icon: ShieldCheck },
  { title: "Operational patient access", body: "Schedule visits, message care teams, review statements, and manage consents without leaving the portal.", icon: CalendarDays },
  { title: "FHIR-ready data surface", body: "Patient, Condition, Observation, AllergyIntolerance, MedicationRequest, DiagnosticReport, Appointment, Immunization, and DocumentReference are exposed through typed route handlers.", icon: FlaskConical },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-serif text-lg text-slate-950">MC</div><div><p className="font-serif text-2xl text-white">MedConnect Pro</p><p className="text-sm text-slate-400">Patient portal and interoperability workspace</p></div></div>
        <div className="flex gap-3 text-sm"><Link href="/login" className="rounded-2xl border border-white/10 px-4 py-2 transition hover:border-cyan-400 hover:text-cyan-200">Sign in</Link><Link href="/register" className="rounded-2xl bg-cyan-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-300">Create account</Link></div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Built for local demo and production handoff</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-white md:text-7xl">A modern patient portal with real Supabase data, authenticated workflows, and FHIR-aligned APIs.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">This build includes responsive auth screens, password recovery, a protected portal shell, scheduling, secure messaging, lab visualization, prescription refill requests, billing, documents, notifications, consents, audit logging, and typed server actions with client and server validation.</p>
          <div className="mt-8 flex flex-wrap gap-4"><Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300">Start patient onboarding <ArrowRight className="h-4 w-4" /></Link><Link href="/dashboard" className="rounded-2xl border border-white/10 px-5 py-3 transition hover:border-cyan-400 hover:text-cyan-200">Open dashboard</Link></div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-[0_40px_120px_-55px_rgba(34,211,238,0.7)] backdrop-blur">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Care snapshot</p><p className="mt-1 font-serif text-3xl text-white">Today at a glance</p></div><Stethoscope className="h-10 w-10 text-cyan-300" /></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-cyan-400/10 p-4"><p className="text-sm text-cyan-100">Upcoming visit</p><p className="mt-2 text-xl text-white">Annual preventive visit</p><p className="mt-1 text-sm text-slate-300">In 3 days with Dr. Avery Patel</p></div>
              <div className="rounded-2xl bg-emerald-400/10 p-4"><p className="text-sm text-emerald-100">Latest result</p><p className="mt-2 text-xl text-white">A1C 5.7%</p><p className="mt-1 text-sm text-slate-300">Trend chart available in labs</p></div>
              <div className="rounded-2xl bg-amber-400/10 p-4"><p className="text-sm text-amber-100">Billing status</p><p className="mt-2 text-xl text-white">1 open invoice</p><p className="mt-1 text-sm text-slate-300">Copay statement due in 14 days</p></div>
              <div className="rounded-2xl bg-white/5 p-4"><p className="text-sm text-slate-300">FHIR endpoints</p><p className="mt-2 text-xl text-white">/api/fhir/*</p><p className="mt-1 text-sm text-slate-300">Patient, Condition, Observation, MedicationRequest, DiagnosticReport, and more</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-3">
        {highlights.map(({ title, body, icon: Icon }) => (
          <article key={title} className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
            <Icon className="h-8 w-8 text-cyan-300" />
            <h2 className="mt-4 font-serif text-2xl text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
