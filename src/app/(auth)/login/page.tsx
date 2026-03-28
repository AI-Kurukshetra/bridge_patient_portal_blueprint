import Link from "next/link";
import { LoginForm } from "@/components/forms/auth-forms";

const workspaceCards = [
  { title: "Patient portal", body: "Dashboard, health records, prescriptions, labs, billing, and documents.", path: "/dashboard" },
  { title: "Provider panel", body: "Care-team workspace with patient charts, clinical history, and schedule visibility.", path: "/care-team" },
  { title: "Admin console", body: "Platform operations, audit visibility, and system oversight.", path: "/admin" },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 lg:grid-cols-[1fr_0.95fr]">
        <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.88),_rgba(15,23,42,0.98))] p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/75">Secure access</p>
          <h1 className="mt-4 font-serif text-5xl text-white">Return to the right care workspace for your role.</h1>
          <p className="mt-6 max-w-md text-slate-300">Patients, providers, and admins use the same MedConnect identity system. After sign-in, the app routes you to the correct panel automatically.</p>
          <div className="mt-8 grid gap-3">
            {workspaceCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{card.title}</p>
                <p className="mt-2 text-sm text-slate-300">{card.body}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-cyan-200/70">{card.path}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="p-8 sm:p-10">
          <h2 className="font-serif text-4xl text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-400">Use your MedConnect email and password. Provider and admin accounts redirect to their panel automatically.</p>
          <div className="mt-8"><LoginForm /></div>
          <p className="mt-6 text-sm text-slate-400">Need an account? <Link href="/register" className="text-cyan-300 transition hover:text-cyan-200">Create one</Link></p>
        </section>
      </div>
    </main>
  );
}