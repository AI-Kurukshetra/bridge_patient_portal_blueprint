"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, FileStack, FlaskConical, LayoutDashboard, MessageSquareText, ReceiptText, ShieldCheck, UserRound, Pill } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/records", label: "Health records", icon: ShieldCheck },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/lab-results", label: "Lab results", icon: FlaskConical },
  { href: "/prescriptions", label: "Prescriptions", icon: Pill },
  { href: "/messaging", label: "Messaging", icon: MessageSquareText },
  { href: "/documents", label: "Documents", icon: FileStack },
  { href: "/billing", label: "Billing", icon: ReceiptText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/consents", label: "Consents", icon: ShieldCheck },
];

export function PortalShell({
  profileName,
  children,
}: {
  profileName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/70 p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-serif text-lg text-slate-950">MC</div><div><p className="font-serif text-2xl">MedConnect</p><p className="text-sm text-slate-400">Patient portal</p></div></div>
          <nav className="mt-8 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Connected care</p>
              <h1 className="font-serif text-3xl text-white">{profileName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-medium">{getInitials(profileName)}</div>
              <form action={logoutAction}><button className="rounded-2xl border border-white/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-200">Sign out</button></form>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

