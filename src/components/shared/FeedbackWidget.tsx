import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "../../lib/analytics";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"bug" | "idea" | "other">("idea");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Simulate sending feedback
    trackEvent("user_feedback_submitted", { type, hasMessage: true });
    
    toast.success("Feedback enviado! Obrigado pela tua ajuda.");
    setMessage("");
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Deixar feedback"
        className="fixed bottom-24 left-4 lg:bottom-4 lg:left-4 z-40 h-10 px-4 rounded-full bg-white border border-slate-200 shadow-md text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        Feedback
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed bottom-24 left-4 lg:bottom-16 lg:left-4 z-50 w-[calc(100vw-32px)] sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  Tens sugestões? 🚀
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label="Fechar widget de feedback"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-slate-100/50 p-1 rounded-lg">
                  {(["idea", "bug", "other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md capitalize transition-colors ${
                        type === t 
                        ? "bg-white shadow-sm text-slate-900" 
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {t === "idea" ? "Ideia" : t === "bug" ? "Problema" : "Outro"}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Diz-nos o que achas. Lemos todas as mensagens!"
                  required
                  className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Confirmar Envio
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
