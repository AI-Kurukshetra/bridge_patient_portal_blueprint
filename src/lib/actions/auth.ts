"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/lib/utils";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth";

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
      : "Account created. Check your email if confirmation is required before signing in.",
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}


