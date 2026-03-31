import { useState, useEffect } from "react";
import { initSentry } from "../../lib/sentry";
import { initAnalytics } from "../../lib/analytics";

const CONSENT_KEY = "vlogin-cookie-consent";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show banner if there is no consent choice recorded
    if (!localStorage.getItem(CONSENT_KEY)) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setIsVisible(false);

    // Initialize tracking after acceptance
    initSentry();
    initAnalytics();
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 w-full z-[100] bg-slate-900 text-white p-4 shadow-xl border-t border-slate-700">
      <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-300">
          Utilizamos cookies para melhorar a sua experiência e analisar o tráfego.
          Ao aceitar, concorda com a nossa política de privacidade.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 rounded-lg hover:bg-slate-800"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors rounded-lg shadow-md shadow-sky-900/20"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
