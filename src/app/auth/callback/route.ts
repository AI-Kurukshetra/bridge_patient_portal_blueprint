import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedAccountRole } from "@/lib/auth/onboarding";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  let redirectUrl = new URL(next, requestUrl.origin);
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(loginUrl);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "invite" | "email_change",
    });
    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(loginUrl);
    }
  }

  const isRecoveryFlow = type === "recovery" || next.startsWith("/reset-password");
  if (!isRecoveryFlow) {
    const synchronized = await syncAuthenticatedAccountRole(supabase);
    if (synchronized?.error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", synchronized.error);
      return NextResponse.redirect(loginUrl);
    }

    if (synchronized && (next === "/dashboard" || !requestUrl.searchParams.get("next"))) {
      redirectUrl = new URL(synchronized.redirectTo, requestUrl.origin);
    }
  }

  return NextResponse.redirect(redirectUrl);
}