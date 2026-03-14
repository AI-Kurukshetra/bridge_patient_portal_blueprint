"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, CalendarDays, Download, FileStack, FlaskConical, LayoutDashboard, Menu, MessageSquareText, Pill, ReceiptText, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { cn, getInitials } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const patientNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/records", label: "Health records", icon: ShieldCheck },
  { href: "/care-team-directory", label: "Care team", icon: UsersRound },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/lab-results", label: "Lab results", icon: FlaskConical },
  { href: "/prescriptions", label: "Prescriptions", icon: Pill },
  { href: "/messaging", label: "Messaging", icon: MessageSquareText },
  { href: "/documents", label: "Documents", icon: FileStack },
  { href: "/data-export", label: "Data export", icon: Download },
  { href: "/billing", label: "Billing", icon: ReceiptText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/consents", label: "Consents", icon: ShieldCheck },
];

const providerNavItems: NavItem[] = [
  { href: "/care-team", label: "Care Team Home", icon: UsersRound },
  { href: "/care-team/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/care-team/patients", label: "Patient Charts", icon: ShieldCheck },
];

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Admin Overview", icon: LayoutDashboard },
];

function getNavItems(variant: "patient" | "provider" | "admin") {
  switch (variant) {
    case "provider":
      return providerNavItems;
    case "admin":
      return adminNavItems;
    default:
      return patientNavItems;
  }
}

function SidebarContent({ close, pathname, subtitle, variant }: { close?: () => void; pathname: string; subtitle: string; variant: "patient" | "provider" | "admin" }) {
  const navItems = getNavItems(variant);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-serif text-lg text-slate-950">MC</div>
        <div>
          <p className="font-serif text-2xl">MedConnect</p>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <nav className="mt-8 grid gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/care-team" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function PortalShell({
  profileName,
  roleLabel,
  subtitle,
  children,
  variant = "patient",
}: {
  profileName: string;
  roleLabel?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "patient" | "provider" | "admin";
}) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const shellSubtitle = subtitle ?? "Patient portal";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a)] text-slate-100">
      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/70" aria-label="Close navigation menu" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative h-full w-[82%] max-w-xs border-r border-white/10 bg-slate-950/95 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.3em] text-cyan-200/75">Navigation</span>
              <button className="rounded-2xl border border-white/10 p-2 transition hover:border-cyan-400 hover:text-cyan-200" onClick={() => setIsDrawerOpen(false)} aria-label="Close navigation drawer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent pathname={pathname} close={() => setIsDrawerOpen(false)} subtitle={shellSubtitle} variant={variant} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-white/10 bg-slate-950/70 p-6 lg:block">
          <SidebarContent pathname={pathname} subtitle={shellSubtitle} variant={variant} />
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <button className="rounded-2xl border border-white/10 p-3 transition hover:border-cyan-400 hover:text-cyan-200 lg:hidden" onClick={() => setIsDrawerOpen(true)} aria-label="Open navigation drawer">
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Connected care</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-3xl text-white">{profileName}</h1>
                  {roleLabel ? <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">{roleLabel}</span> : null}
                </div>
              </div>
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