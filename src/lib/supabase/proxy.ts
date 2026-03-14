import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const guestOnlyRoutes = ["/login", "/register"];
const publicRoutes = ["/", "/forgot-password", "/reset-password", "/auth/callback"];
const publicPrefixes = ["/api/fhir"];

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return response;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname } = request.nextUrl;
  const isPublic = publicRoutes.includes(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isAuthenticated && !isPublic && !guestOnlyRoutes.includes(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (isAuthenticated && guestOnlyRoutes.includes(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return applySecurityHeaders(NextResponse.redirect(dashboardUrl));
  }

  return applySecurityHeaders(response);
}
