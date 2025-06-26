"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthService } from "@/services/auth.service";

const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes (was 1 minute)

export function useSessionRefresh() {
  const { user, refreshUser } = useAuth();
  const authService = useRef(new AuthService());
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    // Update last activity on user interaction
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Add event listeners for meaningful user activity (not mouse moves or scroll)
    const events = ["mousedown", "keydown", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check session periodically with optimizations
    const checkSession = async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;

      // Only refresh if user has been active recently (within last 5 minutes)
      if (timeSinceActivity < SESSION_CHECK_INTERVAL) {
        console.log("[SessionRefresh] User active, refreshing session");
        const { error } = await authService.current.refreshSession();

        if (error) {
          console.error("[SessionRefresh] Session refresh failed:", error);
          // Don't refresh user on error to prevent logout loops
        } else {
          // Only refresh user state if session was actually refreshed
          await refreshUser();
        }
      } else {
        console.log("[SessionRefresh] User inactive, skipping refresh");
      }
    };

    // Set up periodic session check
    const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    // Initial activity timestamp
    updateActivity();

    return () => {
      clearInterval(intervalId);
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [user, refreshUser]);
}
