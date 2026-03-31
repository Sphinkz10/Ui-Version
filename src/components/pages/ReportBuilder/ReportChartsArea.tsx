import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Brain,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Target,
  Copy,
  Trash2,
  Sparkles,
  Lightbulb,
  Search,
  Settings,
  Send,
  Plus,
  ArrowRight,
  Award,
  Clock,
  Shield
} from "lucide-react";
import {
  LineChart as RechartsLine,
  BarChart as RechartsBar,
  AreaChart,
  PieChart as RechartsPie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Area,
  Pie,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { ChartConfig, MetricData, LineData, BarData, AreaData } from "./types";

export interface ReportChartsAreaProps {
  reportTitle: string;
  generatedCharts: ChartConfig[];
  setGeneratedCharts: (charts: ChartConfig[]) => void;
}

export function ReportChartsArea({ reportTitle, generatedCharts, setGeneratedCharts }: ReportChartsAreaProps) {
  return (
    <>
          {/* Executive Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2 text-lg">Resumo Executivo com IA</h3>
                <p className="text-slate-700 leading-relaxed">
                  {reportTitle.includes("progredindo")
                    ? "Progressão detectada em múltiplas métricas. Atleta está 92% do objetivo com ritmo de 8.2% ao mês. Atenção: plateau nos últimos 7 dias - considerar mudança de estímulo."
                    : reportTitle.includes("carga")
                    ? "Carga de treino otimizada com ACWR de 1.2 (zona ideal). Risco de lesão: Baixo. Possível aumento de 5-10% no próximo ciclo."
                    : "Análise completa gerada. Tendências positivas identificadas com oportunidades de otimização."}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Tendência", value: "↗ Positiva", color: "emerald", icon: TrendingUp },
                { label: "Confiança", value: "87%", color: "sky", icon: CheckCircle },
                { label: "Alertas", value: "1 atenção", color: "amber", icon: AlertCircle },
                { label: "Ações", value: "3 sugeridas", color: "violet", icon: Target }
              ].map((stat: { label: string; value: string; color: string; icon: React.ElementType }) => {
                const Icon = stat.icon;
                const colorClasses = {
                  emerald: "bg-emerald-100 text-emerald-700",
                  sky: "bg-sky-100 text-sky-700",
                  amber: "bg-amber-100 text-amber-700",
                  violet: "bg-violet-100 text-violet-700"
                }[stat.color as "emerald" | "sky" | "amber" | "violet"];

                return (
                  <div key={stat.label} className="text-center p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Icon className={`h-3 w-3 ${colorClasses}`} />
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                    <p className={`text-sm font-bold ${colorClasses} px-2 py-1 rounded-lg inline-block`}>
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Charts with Insights */}
          <div className="space-y-4">
            {generatedCharts.map((chart, index) => (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
              >
                {/* Chart Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{chart.title}</h3>
                      {chart.confidence && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {chart.confidence}% confiança
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                        {chart.type === "line" ? "📈 Linha do tempo" :
                         chart.type === "bar" ? "📊 Comparação" :
                         chart.type === "radar" ? "🎯 Radar" :
                         chart.type === "metric" ? "🎯 KPI" : "📊 Gráfico"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toast.success("Gráfico duplicado")}
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedCharts(generatedCharts.filter(c => c.id !== chart.id));
                        toast.success("Gráfico removido");
                      }}
                      className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Chart Rendering */}
                <ChartRenderer config={chart} />

                {/* Insights Section */}
                <div className="mt-6 space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <h4 className="font-semibold text-sm text-slate-900">Análise Inteligente:</h4>
                  </div>

                  {chart.insight && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200"
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-900 font-medium">{chart.insight}</p>
                    </motion.div>
                  )}

                  {chart.suggestion && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start gap-3 p-3 bg-sky-50 rounded-xl border border-sky-200"
                    >
                      <Lightbulb className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-sky-900 font-medium">{chart.suggestion}</p>
                    </motion.div>
                  )}

                  {chart.alert && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200"
                    >
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-900 font-medium">{chart.alert}</p>
                    </motion.div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all"
                  >
                    <Search className="h-3 w-3" />
                    Investigar mais
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Settings className="h-3 w-3" />
                    Ajustar análise
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Send className="h-3 w-3" />
                    Partilhar insight
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add More Charts */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toast.info("Seletor de gráficos em desenvolvimento")}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50 transition-all text-slate-600 hover:text-sky-700 font-medium flex items-center justify-center gap-2 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            Adicionar mais análises
          </motion.button>

          {/* Next Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Próximas Ações Recomendadas</h3>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                3 ações
              </span>
            </div>
            <div className="space-y-2">
              {[
                "Manter carga atual - ritmo de progressão ideal detectado pelo sistema",
                "Considerar mudança de estímulo (excêntrico/isométrico) para quebrar plateau",
                "Agendar avaliação de 1RM em 7 dias para confirmar evolução real"
              ].map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 transition-all cursor-pointer group"
                >
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-700 flex-1">{action}</p>
                  <ArrowRight className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-400 hover:to-emerald-500 transition-all"
              >
                Aplicar todas
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-sm font-semibold rounded-xl border-2 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-all"
              >
                Personalizar
              </motion.button>
            </div>
          </motion.div>

          {/* Impact Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-violet-600" />
              <h3 className="font-bold text-slate-900">Impacto Esperado</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Tempo economizado", value: "45 min", icon: Clock },
                { label: "Decisões informadas", value: "5", icon: CheckCircle },
                { label: "Confiança", value: "87%", icon: Shield },
                { label: "Insights gerados", value: "8", icon: Sparkles }
              ].map((metric: { label: string; value: string; icon: React.ElementType }, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="text-center p-3 bg-white rounded-xl border border-violet-200"
                  >
                    <Icon className="h-4 w-4 text-violet-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-violet-700 mb-0.5">{metric.value}</p>
                    <p className="text-xs text-slate-600">{metric.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

    </>
  );
}

function ChartRenderer({ config }: { config: ChartConfig }) {
  if (config.type === "metric") {
    const metricData = config.data[0] as MetricData | undefined;
    const value = metricData?.value || 92;
    const target = metricData?.target || 100;
    const percentage = Math.round((value / target) * 100);

    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <p className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600 mb-2">
            {value}%
          </p>
        </motion.div>
        <p className="text-sm text-slate-600 mb-4">do objetivo de {target}% alcançado</p>
        <div className="max-w-xs mx-auto">
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 relative"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>0%</span>
            <span className="font-medium text-emerald-600">{percentage}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  }

  if (config.type === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLine data={config.data}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 2 }}
            fill="url(#lineGradient)"
          />
          {(config.data[0] as LineData)?.target && (
            <Line
              type="monotone"
              dataKey="target"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </RechartsLine>
      </ResponsiveContainer>
    );
  }

  if (config.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBar data={config.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="força" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          <Bar dataKey="velocidade" fill="#10b981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="resistência" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          {(config.data[0] as BarData)?.potência && (
            <Bar dataKey="potência" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          )}
        </RechartsBar>
      </ResponsiveContainer>
    );
  }

  if (config.type === "area") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={config.data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area
            type="monotone"
            dataKey="carga"
            stroke="#8b5cf6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorValue)"
            name="Carga Atual"
          />
          {(config.data[0] as AreaData)?.ideal && (
            <Area
              type="monotone"
              dataKey="ideal"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorIdeal)"
              name="Ideal"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (config.type === "radar") {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={config.data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="#64748b" />
          <PolarRadiusAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Radar
            name="João"
            dataKey="A"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="Maria"
            dataKey="B"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '12px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
