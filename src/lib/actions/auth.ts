"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, getAppUrl } from "@/lib/utils";
import { getDefaultRouteForRole, normalizeRole } from "@/lib/auth/roles";
import { syncAuthenticatedAccountRole, validateRegistrationAccessCode } from "@/lib/auth/onboarding";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export async function loginAction(payload: LoginInput): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const explicitRole = profile?.role ? normalizeRole(profile.role) : undefined;
  const synchronized = await syncAuthenticatedAccountRole(supabase, explicitRole);
  if (!synchronized) {
    return { error: { _form: ["Signed in, but the account session could not be restored."] } };
  }

  if (synchronized.error) {
    return { error: { _form: [synchronized.error] } };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { redirectTo: synchronized.redirectTo } };
}

export async function registerAction(payload: RegisterInput): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const accessCodeError = validateRegistrationAccessCode(parsed.data.role, parsed.data.accessCode);
  if (accessCodeError) {
    return { error: { _form: [accessCodeError] } };
  }

  const requestedRedirect = getDefaultRouteForRole(parsed.data.role);
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        requested_role: parsed.data.role,
        provider_specialty: parsed.data.specialty || null,
        provider_organization: parsed.data.organization || null,
        staff_registration_verified: parsed.data.role === "patient" ? false : true,
      },
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${requestedRedirect}`,
    },
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  if (data.session) {
    const synchronized = await syncAuthenticatedAccountRole(supabase, parsed.data.role);
    if (!synchronized || synchronized.error) {
      return { error: { _form: [synchronized?.error ?? "Account created, but role provisioning failed."] } };
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      data: { redirectTo: synchronized.redirectTo },
      message: parsed.data.role === "patient"
        ? "Patient account created. Redirecting to your portal."
        : `Staff account created. Redirecting to the ${parsed.data.role} workspace.`,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: { redirectTo: "/login" },
    message: data.user
      ? `Account created. Check your email to confirm access to the ${parsed.data.role} workspace.`
      : "Account created. Check your email to confirm your account.",
  };
}

export async function requestPasswordResetAction(payload: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  return {
    success: true,
    message: "Password reset email sent. Check your inbox for the recovery link.",
  };
}

export async function updatePasswordAction(payload: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { _form: ["Password recovery session is missing or expired"] } };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/login", "layout");
  return { success: true, message: "Password updated. You can now sign in with the new password." };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
