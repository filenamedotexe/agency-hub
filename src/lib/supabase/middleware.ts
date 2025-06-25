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

// API routes that require authentication but don't need role checks
const authenticatedApiRoutes = [
  "/api/dashboard/stats",
  "/api/clients",
  "/api/content-tools",
  "/api/forms",
  "/api/services",
  "/api/requests",
  "/api/settings",
  "/api/webhooks",
  "/api/tasks",
  "/api/service-templates",
  "/api/attachments",
  "/api/activity-logs",
  "/api/debug",
  "/api/client/forms",
  "/api/client/services",
];

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

  // OFFICIAL SUPABASE PATTERN: Always use getUser() in server code, never getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(`[MIDDLEWARE] getUser result:`, {
    user: user ? { id: user.id, email: user.email } : null,
  });

  // Check if route requires authentication
  const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
    pathname.startsWith(route)
  );

  const isAuthenticatedApiRoute = authenticatedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute && !isAuthenticatedApiRoute) {
    console.log(`[MIDDLEWARE] Non-protected route: ${pathname}`);
    return response;
  }

  console.log(`[MIDDLEWARE] PROTECTED ROUTE: ${pathname}`);

  if (!user) {
    console.log("[MIDDLEWARE] No authenticated user");

    // For API routes, return 401 JSON response instead of redirect
    if (pathname.startsWith("/api/")) {
      console.log("[MIDDLEWARE] API route - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For page routes, redirect to login
    console.log("[MIDDLEWARE] Page route - redirecting to login");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  console.log(`[MIDDLEWARE] Authenticated user: ${user.email}, ID: ${user.id}`);

  // Fetch role from database
  let userRole: string | null = null;
  try {
    console.log(`[MIDDLEWARE] Querying database for user: ${user.id}`);
    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log(`[MIDDLEWARE] Database query result:`, { userData, error });

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
    console.log("[MIDDLEWARE] No user role found");

    // For API routes, return 401 JSON response instead of redirect
    if (pathname.startsWith("/api/")) {
      console.log("[MIDDLEWARE] API route - returning 401 for missing role");
      return NextResponse.json(
        { error: "User role not found" },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    console.log(
      "[MIDDLEWARE] Page route - redirecting to login for missing role"
    );
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "role-not-found");
    return NextResponse.redirect(redirectUrl);
  }

  // If it's an authenticated API route, just check authentication
  if (isAuthenticatedApiRoute) {
    console.log(`[MIDDLEWARE] Authenticated API route: ${pathname}`);
    return response;
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

    // For API routes, return 403 JSON response instead of redirect
    if (pathname.startsWith("/api/")) {
      console.log(
        "[MIDDLEWARE] API route - returning 403 for insufficient permissions"
      );
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // For page routes, handle redirects
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
