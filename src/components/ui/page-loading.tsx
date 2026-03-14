export function PageLoading({ title }: { title: string }) {
  return (
    <div className="grid gap-6">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-white/10" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/75">Loading</p>
        <p className="mt-3 font-serif text-3xl text-white">{title}</p>
        <div className="mt-6 grid gap-3">
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
