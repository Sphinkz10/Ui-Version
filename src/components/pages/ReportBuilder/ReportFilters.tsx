import { motion } from "motion/react";
import { Filter } from "lucide-react";

export function ReportFilters() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-violet-600" />
        Filtros
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Período</label>
          <select className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Últimos 3 meses</option>
            <option>Personalizado</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Atletas</label>
          <select className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white">
            <option>Todos</option>
            <option>João Silva</option>
            <option>Maria Santos</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}
