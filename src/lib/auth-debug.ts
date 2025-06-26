/**
 * Auth Debug Utility
 *
 * Enable debug mode by setting NEXT_PUBLIC_AUTH_DEBUG=true in your .env.local
 * This will help identify where auth is failing or taking too long
 */

export const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";

export function authLog(...args: any[]) {
  if (AUTH_DEBUG) {
    const timestamp = new Date().toISOString();
    const stack = new Error().stack?.split("\n")[2]?.trim() || "";
    console.log(`[AUTH ${timestamp}]`, ...args, "\n  ", stack);
  }
}

export function authTime(label: string) {
  if (AUTH_DEBUG) {
    console.time(`[AUTH-TIMING] ${label}`);
  }
}

export function authTimeEnd(label: string) {
  if (AUTH_DEBUG) {
    console.timeEnd(`[AUTH-TIMING] ${label}`);
  }
}

export function authError(message: string, error: any) {
  // Always log errors, not just in debug mode
  console.error(`[AUTH-ERROR] ${message}`, error);
  if (AUTH_DEBUG && error?.stack) {
    console.error("[AUTH-ERROR] Stack:", error.stack);
  }
}

export function authWarn(message: string, ...args: any[]) {
  if (AUTH_DEBUG) {
    console.warn(`[AUTH-WARN] ${message}`, ...args);
  }
}
