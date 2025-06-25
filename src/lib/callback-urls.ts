/**
 * Utility for generating environment-aware callback URLs
 */

export function getCallbackUrl(toolId: string, isProduction: boolean): string {
  // In production environment, always use the live URL
  if (process.env.NODE_ENV === "production") {
    return `https://agency-hub-two.vercel.app/api/content-tools/${toolId}/callback`;
  }

  // In development, use environment-specific URLs
  if (isProduction) {
    const productionUrl =
      process.env.NEXT_PUBLIC_CALLBACK_BASE_URL_PRODUCTION ||
      "https://agency-hub-two.vercel.app";
    return `${productionUrl}/api/content-tools/${toolId}/callback`;
  } else {
    const testingUrl = process.env.NEXT_PUBLIC_CALLBACK_BASE_URL_TESTING;
    if (!testingUrl || testingUrl.includes("localhost")) {
      // Show placeholder for ngrok setup
      return `https://your-ngrok-url.ngrok.io/api/content-tools/${toolId}/callback`;
    }
    return `${testingUrl}/api/content-tools/${toolId}/callback`;
  }
}

// Helper to check if ngrok is configured
export function isNgrokConfigured(): boolean {
  const testingUrl = process.env.NEXT_PUBLIC_CALLBACK_BASE_URL_TESTING;
  return !!(
    testingUrl &&
    !testingUrl.includes("localhost") &&
    testingUrl.includes("ngrok")
  );
}

// Client-side version that works with window.location
export function getCallbackUrlClient(
  toolId: string,
  isProduction: boolean
): string {
  // If we're on the production site, always use production URL
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "agency-hub-two.vercel.app"
  ) {
    return `https://agency-hub-two.vercel.app/api/content-tools/${toolId}/callback`;
  }

  // Otherwise use the same logic as server
  if (isProduction) {
    const productionUrl =
      process.env.NEXT_PUBLIC_CALLBACK_BASE_URL_PRODUCTION ||
      "https://agency-hub-two.vercel.app";
    return `${productionUrl}/api/content-tools/${toolId}/callback`;
  } else {
    const testingUrl = process.env.NEXT_PUBLIC_CALLBACK_BASE_URL_TESTING;
    if (!testingUrl || testingUrl.includes("localhost")) {
      // Show placeholder for ngrok setup
      return `https://your-ngrok-url.ngrok.io/api/content-tools/${toolId}/callback`;
    }
    return `${testingUrl}/api/content-tools/${toolId}/callback`;
  }
}
