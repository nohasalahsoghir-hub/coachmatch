import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://osrearjvwjbenopyzseo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_bwbUMmkeP2i6sIexnSDdIg_yE8GVZU4";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const pathName = request.nextUrl.pathname;
    const isAuthRoute = pathName.startsWith("/auth");
    const isAthleteRoute = pathName === "/dashboard" || pathName.startsWith("/dashboard/");
    const isCoachRoute = pathName === "/coach" || pathName.startsWith("/coach/");
    const isCallback = pathName === "/auth/callback";

    const isCheckoutRoute = pathName.startsWith("/checkout/");

    if (!user && (isAthleteRoute || isCoachRoute || isCheckoutRoute)) {
      const url = request.nextUrl.clone();
      if (isCoachRoute) {
        url.pathname = "/auth/sign-up";
        url.searchParams.set("role", "coach");
        url.searchParams.set("redirect", pathName);
      } else {
        url.pathname = "/auth/sign-up";
        url.searchParams.set("role", "athlete");
        url.searchParams.set("redirect", pathName);
      }
      return NextResponse.redirect(url);
    }

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const role = profile?.role;

      if (isCallback) return response;

      if (isCoachRoute && role !== "coach") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      if (isAthleteRoute && role === "coach") {
        const url = request.nextUrl.clone();
        url.pathname = "/coach/dashboard";
        return NextResponse.redirect(url);
      }

      if (isAuthRoute && !pathName.startsWith("/auth/verify-email") && !pathName.startsWith("/auth/forgot-password") && !pathName.startsWith("/auth/reset-password")) {
        const url = request.nextUrl.clone();
        url.pathname = role === "coach" ? "/coach/dashboard" : "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (error) {
    console.error("Supabase middleware error:", error);
    return response;
  }
}
