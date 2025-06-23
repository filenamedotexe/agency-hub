import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

// Define protected routes and their required roles
const protectedRoutes = {
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
  "/content-tools": [
    UserRole.ADMIN,
    UserRole.SERVICE_MANAGER,
    UserRole.COPYWRITER,
  ],
  "/settings": [UserRole.ADMIN],
  "/automations": [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  "/client-dashboard": [UserRole.CLIENT],
};

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/api/health", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create a response object that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set the cookie on both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove the cookie from both request and response
          request.cookies.set({
            name,
            value: "",
            ...options,
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

  // Get the user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Check if route requires authentication
  const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    // Redirect to login if not authenticated
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access control
  if (user && isProtectedRoute) {
    // Get user role from database (in production, this would be cached)
    const roleHeader = request.headers.get("x-user-role");

    // Find which protected route pattern matches
    const matchedRoute = Object.keys(protectedRoutes).find((route) =>
      pathname.startsWith(route)
    );

    if (matchedRoute) {
      const allowedRoles =
        protectedRoutes[matchedRoute as keyof typeof protectedRoutes];

      // For now, we'll pass the role check since we need to implement
      // a way to fetch the user's role from the database in middleware
      // This will be handled by the route handlers themselves
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
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
