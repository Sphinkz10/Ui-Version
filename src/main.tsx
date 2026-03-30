
  import { createRoot } from "react-dom/client";
  import { initSentry } from "./lib/sentry";
  import { initAnalytics } from "./lib/analytics";
  
  // Initialize Sentry and PostHog before the app mounts
  initSentry();
  initAnalytics();

  import App from "./App.tsx";
  import "./index.css";
  import { ErrorBoundary } from "./components/ui/ErrorBoundary";

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  