import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/layout/portal-shell";
import { getDefaultRouteForRole, getRoleLabel } from "@/lib/auth/roles";
import { getAuthContext } from "@/lib/auth/server";
import { getPortalData } from "@/lib/queries/portal";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData?.nextLevel === "aal2" && aalData.currentLevel !== aalData.nextLevel) {
    redirect("/mfa");
  }

  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }

  if (auth.role !== "patient") {
    redirect(getDefaultRouteForRole(auth.role));
  }

  const data = await getPortalData();
  if (!data) {
    redirect("/login");
  }

  return (
    <PortalShell
      profileName={data.profile?.full_name ?? "Patient"}
      roleLabel={getRoleLabel(auth.role)}
      subtitle="Patient portal"
      variant="patient"
    >
      {children}
    </PortalShell>
  );
}
