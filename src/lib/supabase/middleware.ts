import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

// Define protected routes and their required roles
const protectedRoutes: Record<string, UserRole[]> = {
  "/dashboard": [
    UserRole.ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.COPYWRITER,
    UserRole.EDITOR,
    UserRole.VA,
  ],
  "/clients": [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  "/services": [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  "/requests": [
    UserRole.ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.COPYWRITER,
    UserRole.EDITOR,
    UserRole.VA,
  ],
  "/forms": [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  "/settings": [UserRole.ADMIN],
  "/automations": [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  "/content-tools": [
    UserRole.ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.COPYWRITER,
    UserRole.EDITOR,
  ],
  "/client-dashboard": [UserRole.CLIENT],
};

// Public routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/api/health", "/api/auth"];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[MIDDLEWARE] Processing: ${pathname}`);

  // Allow exact root path
  if (pathname === "/") {
    console.log(`[MIDDLEWARE] Root path allowed: ${pathname}`);
    return NextResponse.next();
  }

  // Allow public routes
  const matchingPublicRoute = publicRoutes.find((route) =>
    pathname.startsWith(route)
  );
  if (matchingPublicRoute) {
    console.log(
      `[MIDDLEWARE] Public route allowed: ${pathname} (matched: ${matchingPublicRoute})`
    );
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.includes("/_next") || pathname.includes("/favicon.ico")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route requires authentication
  const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    console.log(`[MIDDLEWARE] Non-protected route: ${pathname}`);
    return response;
  }

  console.log(`[MIDDLEWARE] PROTECTED ROUTE: ${pathname}`);

  if (!user) {
    console.log("[MIDDLEWARE] No authenticated user, redirecting to login");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  console.log(`[MIDDLEWARE] Authenticated user: ${user.email}`);

  // Fetch role from database
  let userRole: string | null = null;
  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[MIDDLEWARE] Database error:", error);
      userRole = null;
    } else {
      userRole = userData?.role || null;
      console.log(`[MIDDLEWARE] User role: ${userRole}`);
    }
  } catch (error) {
    console.error("[MIDDLEWARE] Failed to fetch user role:", error);
    userRole = null;
  }

  if (!userRole) {
    console.log("[MIDDLEWARE] No user role found, redirecting to login");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "role-not-found");
    return NextResponse.redirect(redirectUrl);
  }

  // Find which protected route matches
  const matchedRoute = Object.keys(protectedRoutes).find((route) =>
    pathname.startsWith(route)
  );

  if (!matchedRoute) {
    console.log(`[MIDDLEWARE] No matching route for ${pathname}, allowing`);
    return response;
  }

  const allowedRoles = protectedRoutes[matchedRoute];

  console.log(
    `[MIDDLEWARE] Role check: ${userRole} vs [${allowedRoles.join(", ")}]`
  );

  if (!allowedRoles.includes(userRole as UserRole)) {
    console.log(
      `[MIDDLEWARE] ACCESS DENIED: ${userRole} cannot access ${matchedRoute}`
    );

    // Special handling for CLIENT role
    if (userRole === UserRole.CLIENT) {
      console.log("[MIDDLEWARE] Redirecting CLIENT to client dashboard");
      return NextResponse.redirect(new URL("/client-dashboard", request.url));
    }

    // For other roles, redirect to dashboard
    console.log(`[MIDDLEWARE] Redirecting ${userRole} to dashboard`);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  console.log(
    `[MIDDLEWARE] ACCESS GRANTED: ${userRole} can access ${matchedRoute}`
  );
  return response;
}
