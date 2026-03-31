import posthog from 'posthog-js';

// Using dummy key if ENV is not set. In production, VITE_POSTHOG_KEY is required.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_placeholder_key_waiting_for_production';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.posthog.com';

let isInitialized = false;

export const initAnalytics = () => {
  // Check if user has explicitly accepted cookies
  if (typeof window !== "undefined" && localStorage.getItem("vlogin-cookie-consent") !== "accepted") {
    return;
  }

  if (typeof window !== 'undefined' && !isInitialized) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false, // We'll manually capture critical events to respect privacy
      capture_pageview: true,
      capture_pageleave: true,
      opt_in_site_apps: true,
      secure_cookie: import.meta.env.PROD,
    });
    isInitialized = true;
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (isInitialized) {
    posthog.capture(eventName, properties);
  } else {
    // Fallback for local development if not properly initialized
    if (!import.meta.env.PROD) {
      console.log(`[Analytics Track]: ${eventName}`, properties);
    }
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (isInitialized) {
    posthog.identify(userId, properties);
  }
};

export const resetAnalytics = () => {
  if (isInitialized) {
    posthog.reset();
  }
};
