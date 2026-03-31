import { useState } from "react";
import { Plus, Users, Calendar, Dumbbell, FileText, BarChart3, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FABProps {
  onAction: (action: string) => void;
}

export function FAB({ onAction }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: "athlete", icon: Users, label: "Novo Atleta", color: "from-emerald-500 to-emerald-600" },
    { id: "session", icon: Calendar, label: "Agendar Sessão", color: "from-sky-500 to-sky-600" },
    { id: "template", icon: Dumbbell, label: "Criar Template", color: "from-violet-500 to-violet-600" },
    { id: "form", icon: FileText, label: "Enviar Form", color: "from-amber-500 to-amber-600" },
    { id: "report", icon: BarChart3, label: "Criar Relatório", color: "from-sky-500 to-sky-600" },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col gap-3">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                aria-label={action.label}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onAction(action.id);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 pl-4 pr-5 py-3 rounded-xl bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all group"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">{action.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        aria-label={isOpen ? "Fechar menu" : "Abrir menu de ações"}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30 flex items-center justify-center transition-all ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </motion.button>
    </>
  );
}