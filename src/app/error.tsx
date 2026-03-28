"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="font-serif text-3xl text-white">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-300">{error.message}</p>
          <button onClick={reset} className="mt-6 rounded-2xl bg-cyan-400 px-4 py-2 font-medium text-slate-950">Try again</button>
        </div>
      </body>
    </html>
  );
}

