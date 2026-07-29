import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const COACH_PREFIX = "/coach";
const CLIENT_PREFIX = "/client";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isCoachRoute = path.startsWith(COACH_PREFIX);
  const isClientRoute = path.startsWith(CLIENT_PREFIX);

  if (!isCoachRoute && !isClientRoute) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (isCoachRoute && role !== "coach") {
    const url = request.nextUrl.clone();
    url.pathname = role === "client" ? "/client" : "/login";
    return NextResponse.redirect(url);
  }

  if (isClientRoute && role !== "client") {
    const url = request.nextUrl.clone();
    url.pathname = role === "coach" ? "/coach" : "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
