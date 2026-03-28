import { cn } from "@/lib/utils";

export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-sm text-rose-300" role="alert">{message}</p>;
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400">{children}</p>;
}

export function SectionCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_80px_-48px_rgba(34,197,94,0.6)] backdrop-blur", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

const toneClasses: Record<string, string> = {
  scheduled: "bg-sky-500/15 text-sky-200 ring-sky-400/20",
  submitted: "bg-sky-500/15 text-sky-200 ring-sky-400/20",
  confirmed: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
  completed: "bg-slate-500/15 text-slate-100 ring-white/10",
  cancelled: "bg-rose-500/15 text-rose-200 ring-rose-400/20",
  active: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
  approved: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
  under_review: "bg-amber-500/15 text-amber-100 ring-amber-400/20",
  partially_approved: "bg-cyan-500/15 text-cyan-100 ring-cyan-400/20",
  appealed: "bg-cyan-500/15 text-cyan-100 ring-cyan-400/20",
  denied: "bg-rose-500/15 text-rose-100 ring-rose-400/20",
  open: "bg-amber-500/15 text-amber-100 ring-amber-400/20",
  paid: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
  high: "bg-rose-500/15 text-rose-100 ring-rose-400/20",
  low: "bg-slate-500/15 text-slate-100 ring-white/10",
  normal: "bg-emerald-500/15 text-emerald-100 ring-emerald-400/20",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null;

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ring-1", toneClasses[value] ?? "bg-white/10 text-slate-100 ring-white/10")}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_45%),linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,0.95))] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 font-serif text-3xl text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </div>
  );
}