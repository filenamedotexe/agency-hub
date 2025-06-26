import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCachedAuth, setCachedAuth } from "@/lib/middleware-cache";

// SIMPLIFIED MIDDLEWARE - Phase 2 Optimization
// Goals:
// 1. Skip unnecessary checks
// 2. Use caching effectively
// 3. Minimal database queries
// 4. Fast response times

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/api/auth"];
const STATIC_PATTERNS = [
  "/_next",
  "/favicon.ico",
  "/.well-known",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. FAST PATH: Skip static assets immediately
  if (STATIC_PATTERNS.some((pattern) => pathname.includes(pattern))) {
    return NextResponse.next();
  }

  // 2. FAST PATH: Skip public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 3. Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 4. Get user - this is fast, just checking JWT
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // Not authenticated - redirect to login
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Check cache for user role
  const cached = getCachedAuth(user.id);
  if (cached) {
    // Cache hit - no DB query needed!
    response.headers.set("x-user-role", cached.role);
    response.headers.set("x-cache-status", "hit");
    return response;
  }

  // 6. Cache miss - fetch from DB (only happens once per minute per user)
  try {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role) {
      // Cache for next time
      setCachedAuth(user.id, user, userData.role);
      response.headers.set("x-user-role", userData.role);
      response.headers.set("x-cache-status", "miss");
    }
  } catch (e) {
    // If DB fails, still allow access but don't cache
    console.error("Failed to fetch user role:", e);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
