export const appRoles = ["patient", "provider", "admin"] as const;

export type AppRole = (typeof appRoles)[number];

export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "provider" || role === "admin") {
    return role;
  }

  return "patient";
}

export function getDefaultRouteForRole(role: AppRole) {
  switch (role) {
    case "provider":
      return "/care-team";
    case "admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}

export function getRoleLabel(role: AppRole) {
  switch (role) {
    case "provider":
      return "Care Team";
    case "admin":
      return "Platform Admin";
    default:
      return "Patient";
  }
}
