import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = [
  "/home",
  "/session",
  "/dashboard",
  "/programme",
  "/settings",
  "/onboarding",
  "/admin",
];

const PUBLIC_ROUTES = ["/login", "/signup"];

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes pass through — they handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public routes are always accessible
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check session
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no session, redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If session exists but onboarding not complete and not already on /onboarding
  // We need to check this via user metadata or a separate cookie
  // The Prisma onboardingComplete field can't be queried in middleware (edge runtime)
  // Instead we use a cookie that the server sets after onboarding completes
  const onboardingComplete = request.cookies.get("onboarding_complete")?.value;

  if (
    onboardingComplete !== "true" &&
    !pathname.startsWith("/onboarding")
  ) {
    // We'll redirect to onboarding if the cookie indicates it's not done
    // The cookie is set on the login page / after onboarding completes
    // Only redirect if the cookie is explicitly "false"
    if (onboardingComplete === "false") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
