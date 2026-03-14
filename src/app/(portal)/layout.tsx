import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { getPortalData } from "@/lib/queries/portal";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const data = await getPortalData();
  if (!data) {
    redirect("/login");
  }

  return <PortalShell profileName={data.profile?.full_name ?? "Patient"}>{children}</PortalShell>;
}

