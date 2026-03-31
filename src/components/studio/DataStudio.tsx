import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download, Zap, TrendingUp, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { QuantumForecast } from './QuantumForecast';

interface DataStudioProps {
  onBack?: () => void;
}

export function DataStudio({ onBack }: DataStudioProps) {
  const [dataView, setDataView] = useState<'realtime' | 'historical' | 'predictive'>('predictive'); // Inicia no modo Quantum Forecast

  const performanceData = [
    { week: 'S1', power: 320, velocity: 0.85, rpe: 7.2 },
    { week: 'S2', power: 335, velocity: 0.88, rpe: 7.5 },
    { week: 'S3', power: 342, velocity: 0.91, rpe: 7.8 },
    { week: 'S4', power: 358, velocity: 0.94, rpe: 8.1 },
    { week: 'S5', power: 365, velocity: 0.96, rpe: 8.3 },
    { week: 'S6', power: 378, velocity: 0.99, rpe: 8.5 },
  ];

  const zoneData = [
    { zone: 'Z1', time: 15, color: '#10b981' },
    { zone: 'Z2', time: 25, color: '#3b82f6' },
    { zone: 'Z3', time: 30, color: '#f59e0b' },
    { zone: 'Z4', time: 20, color: '#ef4444' },
    { zone: 'Z5', time: 10, color: '#dc2626' },
  ];

  const correlations = [
    { metric1: 'Sleep', metric2: 'Performance', value: 0.87, type: 'positive' },
    { metric1: 'Stress', metric2: 'Recovery', value: -0.65, type: 'negative' },
    { metric1: 'Velocity', metric2: 'Power', value: 0.92, type: 'positive' },
  ];

  const handleApplyScenario = async (scenario: any) => {
    // TODO: Integração com backend
    // POST /api/workout/apply-quantum-scenario
    // Body: scenario data

    // Simulação de sucesso
    alert(`✅ Cenário "${scenario.name}" aplicado com sucesso!

📊 MUDANÇAS APLICADAS:
• Frequência: ${scenario.variables.trainingFrequency}x/semana
• Volume: ${(scenario.variables.volumeMultiplier * 100).toFixed(0)}% do atual
• Meta de sono: ${scenario.variables.sleepHours}h/noite
• Target de stress: ${scenario.variables.stressLevel}/10
• Nutrição alvo: ${scenario.variables.nutritionQuality}/10

🎯 RESULTADOS ESPERADOS:
• Ganho de performance: +${scenario.predictions.performanceGain}%
• Confiança: ${scenario.predictions.confidence}%
• Risco de lesão: ${scenario.predictions.injuryRisk}%
• Tempo até meta: ${scenario.predictions.timeToGoal} dias

🔄 Seus treinos foram ajustados automaticamente!`);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="flex-none p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </button>
            )}
            <div>
              <h1 className="text-slate-900">Data Studio</h1>
              <p className="text-sm text-slate-600">
                Análise avançada de performance
              </p>
            </div>
          </div>

          <div className="hidden sm:flex gap-2">
            <button className="px-4 py-2 text-sm border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              📥 Importar
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Conectar Wearable
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['realtime', 'historical', 'predictive'].map((view) => (
            <button
              key={view}
              onClick={() => setDataView(view as any)}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-sm rounded-xl capitalize transition-all whitespace-nowrap shrink-0 ${
                dataView === view
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-300'
              }`}
            >
              {view === 'realtime' && '⚡ '}
              {view === 'historical' && '📊 '}
              {view === 'predictive' && '🔮 '}
              <span className="hidden sm:inline">{view}</span>
              <span className="sm:hidden">
                {view === 'realtime' && 'Real-time'}
                {view === 'historical' && 'Histórico'}
                {view === 'predictive' && 'Previsão'}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Content - Scroll Area with pb for mobile nav */}
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <div className="p-4 sm:p-6">
          {dataView === 'predictive' ? (
            /* MODO PREDITIVO - Quantum Forecast */
            (<QuantumForecast
              historicalData={performanceData}
              onApplyScenario={handleApplyScenario} 
            />)
          ) : (
            /* MODOS REALTIME E HISTORICAL */
            (<div className="max-w-7xl mx-auto space-y-6">
              {/* Main Performance Chart */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-900">Performance Over Time</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg">
                      Poder
                    </button>
                    <button className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg">
                      Velocidade
                    </button>
                    <button className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg">
                      RPE
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="power"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Potência (W)"
                    />
                    <Line
                      type="monotone"
                      dataKey="velocity"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Velocidade (m/s)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Real-time Power */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm text-slate-900">Output em Tempo Real</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl text-emerald-600 mb-2">342W</div>
                    <div className="text-slate-600 mb-4">Potência média</div>
                    <div className="flex justify-center gap-2">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
                        ↑ 8% vs ontem
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-sm text-slate-900 mb-4">🎯 Distribuição de Zonas</h3>
                  <div className="space-y-3">
                    {zoneData.map((zone) => (
                      <div key={zone.zone}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700">{zone.zone}</span>
                          <span className="text-slate-900">{zone.time}min</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${zone.time}%`,
                              backgroundColor: zone.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-sm text-slate-900 mb-4">📈 Stats da Sessão</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Carga Total</div>
                      <div className="text-2xl text-slate-900">12,450 kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Volume</div>
                      <div className="text-2xl text-slate-900">156 reps</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 mb-1">Densidade</div>
                      <div className="text-2xl text-slate-900">87%</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Correlations */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="text-slate-900 mb-4">🔗 Correlações Detectadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {correlations.map((corr, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl border border-slate-200"
                    >
                      <div
                        className={`text-2xl mb-2 ${
                          corr.type === 'positive' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {corr.value.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-900 mb-1">
                        {corr.metric1} ↔ {corr.metric2}
                      </div>
                      <div className="text-xs text-slate-600">
                        Correlação {corr.type === 'positive' ? 'positiva' : 'negativa'}{' '}
                        {Math.abs(corr.value) > 0.8 ? 'forte' : 'moderada'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-slate-900">Insights IA</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <div className="text-2xl">💡</div>
                    <div>
                      <div className="text-sm text-slate-900 mb-1">
                        Padrão de performance detectado
                      </div>
                      <div className="text-xs text-slate-600">
                        Atleta apresenta melhor performance às segundas-feiras (+12% output).
                        Considere agendar sessões de maior intensidade neste dia.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <div className="text-sm text-slate-900 mb-1">Alerta de fadiga</div>
                      <div className="text-xs text-slate-600">
                        Velocidade média caiu 7% nas últimas 3 sessões. Recomenda-se uma sessão
                        de recuperação ativa.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="text-sm text-slate-900 mb-1">Meta alcançável</div>
                      <div className="text-xs text-slate-600">
                        Com progressão atual, atleta deve atingir 1RM de 150kg em 4 semanas
                        (85% de confiança).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>)
          )}
        </div>
      </div>
    </div>
  );
}