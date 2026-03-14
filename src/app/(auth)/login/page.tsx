import Link from "next/link";
import { LoginForm } from "@/components/forms/auth-forms";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 lg:grid-cols-[1fr_0.95fr]">
        <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.88),_rgba(15,23,42,0.98))] p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/75">Secure access</p>
          <h1 className="mt-4 font-serif text-5xl text-white">Return to your care workspace.</h1>
          <p className="mt-6 max-w-md text-slate-300">Review upcoming visits, lab trends, messages, statements, and consent settings in one authenticated portal.</p>
        </section>
        <section className="p-8 sm:p-10">
          <h2 className="font-serif text-4xl text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-400">Use your MedConnect email and password.</p>
          <div className="mt-8"><LoginForm /></div>
          <p className="mt-6 text-sm text-slate-400">New here? <Link href="/register" className="text-cyan-300 transition hover:text-cyan-200">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
