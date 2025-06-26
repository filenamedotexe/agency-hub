/**
 * @module auth-error-boundary
 * @description Error boundary component for graceful auth failure handling
 *
 * This component catches authentication-related errors and provides a user-friendly
 * recovery mechanism. It prevents the app from completely crashing when auth
 * failures occur, offering users a way to recover by returning to the login page.
 *
 * Key features:
 * - Catches and logs auth-related errors
 * - Clears corrupted auth state from sessionStorage
 * - Provides user-friendly error message
 * - One-click recovery to login page
 *
 * @example
 * ```tsx
 * // Wrap your app with the error boundary
 * <AuthErrorBoundary>
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 * </AuthErrorBoundary>
 * ```
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[AuthErrorBoundary] Auth error caught:", error, errorInfo);
  }

  handleReset = () => {
    // Clear auth state and reload
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth-state");
      window.location.href = "/login";
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Authentication Error
            </h2>
            <p className="mb-6 text-gray-600">
              We encountered an error with your authentication. Please try
              logging in again.
            </p>
            <Button onClick={this.handleReset} className="w-full">
              Return to Login
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
