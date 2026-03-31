import { motion } from "motion/react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ReportHeaderProps {
  onBack: () => void;
  reportTitle: string;
  setReportTitle: (title: string) => void;
  chartsCount: number;
}

export function ReportHeader({ onBack, reportTitle, setReportTitle, chartsCount }: ReportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          ←
        </motion.button>
        <div>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className="font-bold text-slate-900 bg-transparent border-none focus:outline-none text-lg w-full sm:w-auto"
            placeholder="Nome do Relatório"
          />
          <p className="text-sm text-slate-600">
            {chartsCount} análise{chartsCount !== 1 ? 's' : ''} com insights automáticos
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast.success("📄 Exportando para PDF...")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast.success("📤 Partilhando relatório...")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-400 hover:to-emerald-500 transition-all"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Partilhar</span>
        </motion.button>
      </div>
    </div>
  );
}
