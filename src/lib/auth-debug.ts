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

// Track active timers to prevent collisions
const activeTimers = new Set<string>();

export function authTime(label: string) {
  if (AUTH_DEBUG) {
    const timerKey = `[AUTH-TIMING] ${label}`;
    if (activeTimers.has(timerKey)) {
      console.warn(`Timer '${timerKey}' already exists, skipping`);
      return;
    }
    activeTimers.add(timerKey);
    console.time(timerKey);
  }
}

export function authTimeEnd(label: string) {
  if (AUTH_DEBUG) {
    const timerKey = `[AUTH-TIMING] ${label}`;
    if (!activeTimers.has(timerKey)) {
      console.warn(`Timer '${timerKey}' does not exist, skipping`);
      return;
    }
    activeTimers.delete(timerKey);
    console.timeEnd(timerKey);
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
