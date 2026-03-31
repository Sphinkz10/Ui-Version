import * as Sentry from "@sentry/react";

export function initSentry() {
  // Check if user has explicitly accepted cookies
  if (typeof window !== "undefined" && localStorage.getItem("vlogin-cookie-consent") !== "accepted") {
    return;
  }

  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, 
      // Session Replay
      replaysSessionSampleRate: 0.1, 
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE || "development",
    });
  } else {
    console.warn("Sentry is disabled: VITE_SENTRY_DSN is missing in environment variables.");
  }
}
