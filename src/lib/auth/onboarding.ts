import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getDefaultRouteForRole, normalizeRole, type AppRole } from "@/lib/auth/roles";

import { isStaffRole } from "@/lib/auth/onboarding-config";

const demoAccessCodes: Record<Exclude<AppRole, "patient">, string> = {
  provider: process.env.MEDCONNECT_PROVIDER_ACCESS_CODE ?? "PROVIDER-DEMO-2026",
  admin: process.env.MEDCONNECT_ADMIN_ACCESS_CODE ?? "ADMIN-DEMO-2026",
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ProvisioningSelection = {
  role: AppRole;
  providerSpecialty: string | null;
  providerOrganization: string | null;
};

function getMetadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function resolveProvisioningSelection(user: User, storedRole?: AppRole | null): ProvisioningSelection {
  if (storedRole === "provider" || storedRole === "admin") {
    return {
      role: storedRole,
      providerSpecialty: getMetadataString(user, "provider_specialty") || null,
      providerOrganization: getMetadataString(user, "provider_organization") || null,
    };
  }

  const requestedRole = normalizeRole(getMetadataString(user, "requested_role") || storedRole || "patient");
  const verified = user.user_metadata?.staff_registration_verified === true;
  const role = requestedRole !== "patient" && verified ? requestedRole : "patient";

  return {
    role,
    providerSpecialty: getMetadataString(user, "provider_specialty") || null,
    providerOrganization: getMetadataString(user, "provider_organization") || null,
  };
}

export function validateRegistrationAccessCode(role: AppRole, accessCode?: string | null) {
  if (!isStaffRole(role)) {
    return null;
  }

  const expectedCode = demoAccessCodes[role];
  if ((accessCode ?? "").trim() === expectedCode) {
    return null;
  }

  return role === "provider"
    ? "Invalid provider access code. This demo requires the configured staff code to create a provider account."
    : "Invalid admin access code. This demo requires the configured staff code to create an admin account.";
}

async function getStoredRole(supabase: SupabaseServerClient, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return profile ? normalizeRole(profile.role) : null;
}

export async function syncAuthenticatedAccountRole(
  supabaseArg?: SupabaseServerClient,
  explicitRole?: AppRole,
) {
  const supabase = supabaseArg ?? await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const storedRole = explicitRole ?? (await getStoredRole(supabase, user.id));
  const selection = resolveProvisioningSelection(user, storedRole);
  const { error } = await supabase.rpc("provision_account_role", {
    target_role: selection.role,
    provider_specialty: selection.providerSpecialty,
    provider_organization: selection.providerOrganization,
  });

  if (error) {
    return {
      error: error.message,
      redirectTo: "/login",
      role: selection.role,
    };
  }

  const finalizedRole = (await getStoredRole(supabase, user.id)) ?? selection.role;
  if (finalizedRole === "patient") {
    await supabase.rpc("seed_demo_data_for_current_user");
  }

  return {
    role: finalizedRole,
    redirectTo: getDefaultRouteForRole(finalizedRole),
  };
}