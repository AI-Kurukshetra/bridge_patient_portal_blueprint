import Link from "next/link";
import { RegisterForm } from "@/components/forms/auth-forms";

const onboardingCards = [
  { title: "Patient", body: "Open self-registration for the patient portal demo." },
  { title: "Provider", body: "Requires a provider access code and provisions the care-team workspace." },
  { title: "Admin", body: "Requires an admin access code and provisions the operations console." },
];

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 lg:grid-cols-[1fr_0.95fr]">
        <section className="hidden bg-[radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.24),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.88),_rgba(15,23,42,0.98))] p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/75">Onboarding</p>
          <h1 className="mt-4 font-serif text-5xl text-white">Create a patient, provider, or admin account from one flow.</h1>
          <p className="mt-6 max-w-md text-slate-300">The app provisions the correct role and routes users into the patient portal, care-team workspace, or admin console after authentication.</p>
          <div className="mt-8 grid gap-3">
            {onboardingCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{card.title}</p>
                <p className="mt-2 text-sm text-slate-300">{card.body}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="p-8 sm:p-10">
          <h2 className="font-serif text-4xl text-white">Create account</h2>
          <p className="mt-2 text-sm text-slate-400">Patient signup is open. Provider and admin roles require a configured staff access code in this local demo.</p>
          <div className="mt-8"><RegisterForm /></div>
          <p className="mt-6 text-sm text-slate-400">Already registered? <Link href="/login" className="text-cyan-300 transition hover:text-cyan-200">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}