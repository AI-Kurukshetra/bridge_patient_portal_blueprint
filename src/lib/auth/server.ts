import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDefaultRouteForRole, normalizeRole, type AppRole } from "@/lib/auth/roles";
import type { Row } from "@/types/database";

export type AuthContext = {
  profile: Row<"profiles">;
  role: AppRole;
  userId: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    profile,
    role: normalizeRole(profile.role),
    userId: user.id,
  };
}

export async function requireRole(allowedRoles: AppRole[]) {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login");
  }

  if (!allowedRoles.includes(context.role)) {
    redirect(getDefaultRouteForRole(context.role));
  }

  return context;
}
