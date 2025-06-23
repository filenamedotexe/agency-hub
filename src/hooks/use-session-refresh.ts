"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthService } from "@/services/auth.service";

const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute

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

    // Add event listeners for user activity
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Check session periodically
    const checkSession = async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;

      // If user has been active within the refresh interval
      if (timeSinceActivity < SESSION_REFRESH_INTERVAL) {
        const { error } = await authService.current.refreshSession();

        if (error) {
          console.error("Session refresh failed:", error);
          // Let the auth state change handler deal with this
        } else {
          await refreshUser();
        }
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
