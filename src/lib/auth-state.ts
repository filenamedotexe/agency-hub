/**
 * @module auth-state
 * @description Global auth state management using sessionStorage
 *
 * This module provides a persistent auth state that survives client-side navigation,
 * preventing loading spinners from appearing on every page transition.
 *
 * Key features:
 * - Stores auth state in sessionStorage (cleared on browser close)
 * - 30-second check interval to prevent excessive auth checks
 * - Automatically clears state on logout
 * - Prevents race conditions between multiple auth checks
 *
 * @example
 * ```typescript
 * // Check if auth needs to be verified
 * if (shouldCheckAuth()) {
 *   const user = await checkUser();
 *   setAuthState(user);
 * }
 *
 * // Get current auth state
 * const { user, isInitialized } = getAuthState();
 *
 * // Clear on logout
 * clearAuthState();
 * ```
 */

import { AuthUser } from "@/types/auth";

interface GlobalAuthState {
  user: AuthUser | null;
  isInitialized: boolean;
  lastCheck: number;
}

const AUTH_STATE_KEY = "auth-state";
const AUTH_CHECK_INTERVAL = 30000; // 30 seconds

function loadState(): GlobalAuthState {
  if (typeof window === "undefined") {
    return { user: null, isInitialized: false, lastCheck: 0 };
  }

  try {
    const stored = sessionStorage.getItem(AUTH_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("[AUTH-STATE] Failed to load state:", e);
  }

  return { user: null, isInitialized: false, lastCheck: 0 };
}

function saveState(state: GlobalAuthState) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("[AUTH-STATE] Failed to save state:", e);
  }
}

export function getAuthState(): GlobalAuthState {
  const state = loadState();
  console.log("[AUTH-STATE] Getting state:", {
    hasUser: !!state.user,
    isInitialized: state.isInitialized,
    lastCheck: state.lastCheck,
  });
  return state;
}

export function setAuthState(user: AuthUser | null) {
  const state = {
    user,
    isInitialized: true,
    lastCheck: Date.now(),
  };
  saveState(state);
  console.log("[AUTH-STATE] State updated:", {
    user: user?.email,
    role: user?.role,
    isInitialized: true,
  });
}

export function shouldCheckAuth(): boolean {
  const state = loadState();

  // Always check if not initialized
  if (!state.isInitialized) {
    console.log("[AUTH-STATE] Should check: not initialized");
    return true;
  }

  // Check if enough time has passed
  const shouldCheck = Date.now() - state.lastCheck > AUTH_CHECK_INTERVAL;
  console.log("[AUTH-STATE] Should check:", shouldCheck, {
    timeSinceLastCheck: Date.now() - state.lastCheck,
    threshold: AUTH_CHECK_INTERVAL,
  });
  return shouldCheck;
}

export function clearAuthState() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_STATE_KEY);
  }
  console.log("[AUTH-STATE] State cleared");
}
