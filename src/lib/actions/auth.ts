"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, getAppUrl } from "@/lib/utils";
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

export async function loginAction(payload: LoginInput): Promise<ActionResult> {
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

  await supabase.rpc("seed_demo_data_for_current_user");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function registerAction(payload: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  if (data.session) {
    await supabase.rpc("seed_demo_data_for_current_user");
  }

  revalidatePath("/dashboard", "layout");
  return {
    success: true,
    message: data.session
      ? "Account created. Redirecting to your portal."
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
