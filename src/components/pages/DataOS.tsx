import { useState, useEffect } from 'react';
import { DataOSProvider } from '../dataos/context/DataOSContext';
// REMOVED: import { VisualBuilder } from '../dataos/builder/VisualBuilder';
// REMOVED: import { QuantumForecastMain } from '../dataos/quantum/QuantumForecastMain';
import { motion } from 'motion/react';
import { Database, Activity, Target, Plus, TrendingUp, Package, BookOpen, Zap, Sparkles, Calculator } from 'lucide-react';

// V2: New Library
import { LibraryMain, LibraryUnifiedWithModals } from '../dataos/v2/library';
// V2 FASE 3: Live Board
import { LiveBoardMain } from '../dataos/v2/liveboard';
// V2 FASE 4: Automation
import { AutomationMain } from '../dataos/v2/automation';
// V2 FASE 5: Insights (NEW!)
import { InsightsMain } from '../dataos/v2/insights';
// V3: Custom Metrics (WEEK 2 - ADITIVO, NÃO SUBSTITUI V2)
import { CustomMetricsMain } from '../dataos/v3';
// FASE 3: Import Manual Entry components
import { QuickEntryModal } from '../dataos/QuickEntryModal';
import { BulkEntryModal } from '../dataos/BulkEntryModal';
// FASE 5: Import Visualization
import { MetricHistoryDrawer } from '../dataos/MetricHistoryDrawer';
// Import tooltips and badges
import { HelpTooltip, InfoBadge } from '@/components/shared/HelpTooltip';
// ✅ NEW: Import Responsive Navigation
import { DataOSNavigation, type DataOSTab } from '../dataos/v2/navigation';
// ✅ NEW: Import Data Hooks
import { useMetrics } from '@/hooks/useMetrics';
import { useAvailableAthletes } from '@/hooks/use-api';
import type { Metric } from '@/types/metrics';

// REMOVE: import { mockMetrics } from '@/lib/mockDataSprint0';

// Mock athletes removed - replaced by useAvailableAthletes
// const mockAthletes = ...

interface DataOSProps {
  onCreateMetric?: () => void;
  workspaceId?: string;
  workspaceName?: string;
  readOnly?: boolean; // ✅ New prop for athlete read-only mode
}

export function DataOS({ onCreateMetric, workspaceId = 'workspace-1', workspaceName = 'Workspace', readOnly = false }: DataOSProps) {
  // ✅ Map activeTab to DataOSTab type (handle 'custommetrics' which doesn't exist in DataOSTab)
  const [activeTab, setActiveTab] = useState<DataOSTab>('library');
  const [showCustomMetrics, setShowCustomMetrics] = useState(false);
  // 🧪 TESTE: Toggle between LibraryMain and LibraryUnified
  const [useUnifiedLibrary, setUseUnifiedLibrary] = useState(true); // ✅ TRUE = Use new unified library

  // ✅ DATA FETCHING
  const { metrics, loading: metricsLoading, mutate: refreshMetrics } = useMetrics(workspaceId);
  const { athletes, loading: athletesLoading } = useAvailableAthletes(workspaceId);

  // FASE 2: Metrics state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);

  // LEGACY STATE REMOVED: const [metrics, setMetrics] = useState<Metric[]>([]);

  // FASE 3: Manual Entry state
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);

  // FASE 5: History Drawer state
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyAthleteId, setHistoryAthleteId] = useState<string>('athlete-1'); // Default athlete

  // Handlers
  // NOTE: LibraryUnified handles its own CRUD updates via SWR cache invalidation
  // We can force refresh if needed using refreshMetrics()

  const handleCreateMetric = (newMetric: Metric) => {
    // setMetrics(prev => [...prev, newMetric]); // DEPRECATED
    refreshMetrics();
  };

  const handleEditMetric = (metric: Metric) => {
    setSelectedMetric(metric);
    setIsEditDrawerOpen(true);
  };

  const handleUpdateMetric = (updatedMetric: Metric) => {
    // setMetrics(prev => prev.map(m => m.id === updatedMetric.id ? updatedMetric : m)); // DEPRECATED
    refreshMetrics();
    setIsEditDrawerOpen(false);
  };

  const handleDeleteMetric = (metric: Metric) => {
    setSelectedMetric(metric);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (deletedMetric: Metric) => {
    refreshMetrics();
    setIsDeleteModalOpen(false);
  };

  // FASE 5: View History handler
  const handleViewHistory = (metric: Metric) => {
    setSelectedMetric(metric);
    setIsHistoryDrawerOpen(true);
  };

  // FASE 3: Quick Entry handler
  const handleQuickEntrySave = async (entry: any) => {
    try {
      // Call API
      const response = await fetch('/api/metric-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricId: entry.metricId,
          athleteId: entry.athleteId,
          value: entry.value,
          timestamp: entry.timestamp,
          notes: entry.notes,
          sourceType: 'manual_entry',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      const result = await response.json();

      // Show success with analysis
      const { update, analysis } = result;
      const zoneEmoji = analysis.zone === 'green' ? '🟢' : analysis.zone === 'yellow' ? '🟡' : '🔴';

      alert(
        `✅ Métrica inserida com sucesso!\n\n` +
        `Valor: ${update.value}\n` +
        `Status: ${zoneEmoji} ${analysis.zoneReason || analysis.zone}\n` +
        `Baseline: ${analysis.baseline?.toFixed(1) || 'N/A'}\n` +
        `Tendência: ${analysis.trend === 'increasing' ? '📈 Subindo' : '📉 Descendo'}`
      );

      // Close modal
      setIsQuickEntryOpen(false);
      refreshMetrics(); // Refresh data
    } catch (error) {
      console.error('Error saving quick entry:', error);
      alert(`❌ Erro ao guardar:\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // FASE 3: Bulk Entry handler
  const handleBulkEntrySave = async (entries: any[]) => {
    try {
      // Call BULK API
      const response = await fetch('/api/metric-updates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: entries.map(entry => ({
            metricId: entry.metricId,
            athleteId: entry.athleteId,
            value: entry.value,
            timestamp: entry.timestamp,
            notes: entry.notes,
            sourceType: 'manual_entry',
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      const result = await response.json();

      // Show success with summary
      const { results, summary } = result;
      const { green, yellow, red } = summary.zoneDistribution;

      alert(
        `✅ Bulk Entry completo!\\n\\n` +
        `Total: ${results.total}\\n` +
        `Sucesso: ${results.successful} ✅\\n` +
        `Falhas: ${results.failed} ❌\\n\\n` +
        `Distribuição:\\n` +
        `🟢 Verde: ${green}\\n` +
        `🟡 Amarelo: ${yellow}\\n` +
        `🔴 Vermelho: ${red}\\n\\n` +
        `Média: ${summary.averageValue?.toFixed(1) || 'N/A'}`
      );

      // Close modal
      setIsBulkEntryOpen(false);
      refreshMetrics(); // Refresh data
    } catch (error) {
      console.error('Error saving bulk entry:', error);
      alert(`❌ Erro ao guardar:\\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  return (
    <DataOSProvider>
      <div className="h-full flex flex-col overflow-hidden">
        {/* ✅ NEW: Responsive Navigation */}
        <DataOSNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userName="João Silva"
        />

        {/* ✅ Read-Only Banner for Athletes */}
        {readOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 max-w-7xl mx-auto">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-lg">👁️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  Modo Visualização
                </p>
                <p className="text-xs text-amber-700">
                  Podes ver todas as métricas que o teu coach te atribuiu, mas não podes criar ou editar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-white">
          {activeTab === 'library' && (
            <div className="h-full overflow-y-auto pb-20 lg:pb-6">
              {useUnifiedLibrary ? (
                <LibraryUnifiedWithModals
                  onCreateMetric={() => onCreateMetric?.()}
                  workspaceId={workspaceId}
                  workspaceName={workspaceName}
                />
              ) : (
                <LibraryMain
                  onCreateMetric={() => onCreateMetric?.()}
                  onEdit={handleEditMetric}
                  onDelete={handleDeleteMetric}
                  onViewHistory={handleViewHistory}
                  workspaceId={workspaceId}
                  workspaceName={workspaceName}
                />
              )}
            </div>
          )}

          {activeTab === 'liveboard' && (
            <div className="h-full overflow-y-auto pb-20 lg:pb-6">
              <LiveBoardMain
                onViewMetricHistory={(metricId) => {
                  const metric = metrics.find(m => m.id === metricId);
                  if (metric) handleViewHistory(metric);
                }}
                onRefresh={() => {}}
                workspaceId={workspaceId}
                workspaceName={workspaceName}
              />
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="h-full overflow-y-auto pb-20 lg:pb-6">
              <AutomationMain
                onCreateRule={() => {}}
                workspaceId={workspaceId}
                workspaceName={workspaceName}
              />
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="h-full overflow-y-auto pb-20 lg:pb-6">
              <InsightsMain
                workspaceId={workspaceId}
                workspaceName={workspaceName}
              />
            </div>
          )}

          {activeTab === 'entry' && (
            <div className="h-full overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
              {/* FASE 3: Manual Entry Tab Content */}
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-bold text-slate-900">Manual Entry</h2>
                    <HelpTooltip
                      title="Manual Entry - Inserção Manual"
                      content={
                        <>
                          <p>Insere valores de métricas manualmente de 2 formas:</p>
                          <ul className="mt-2 space-y-2">
                            <li>
                              <strong className="text-sky-300">⚡ Quick Entry</strong>
                              <p className="text-xs text-slate-300">1 valor para 1 atleta (rápido e simples)</p>
                            </li>
                            <li>
                              <strong className="text-purple-300">📊 Bulk Entry</strong>
                              <p className="text-xs text-slate-300">Valores para múltiplos atletas ao mesmo tempo</p>
                            </li>
                          </ul>
                          <p className="mt-3 text-xs text-emerald-300 border-t border-slate-700 pt-2">
                            ✅ Validação automática vs baseline
                          </p>
                          <p className="mt-1 text-xs text-amber-300">
                            🎯 Zonas (verde/amarelo/vermelho) calculadas em tempo real
                          </p>
                        </>
                      }
                      position="bottom"
                    />
                    <HelpTooltip
                      title="📊 Validação Automática"
                      content={
                        <>
                          <p className="font-semibold mb-2">Cada valor inserido é validado:</p>
                          <div className="space-y-3">
                            <div>
                              <p className="font-semibold text-emerald-300">1. Baseline Comparison 📏</p>
                              <p className="text-xs text-slate-300">
                                Compara com média histórica do atleta
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-sky-300">2. Zone Detection 🎯</p>
                              <p className="text-xs text-slate-300">
                                Calcula zona automática (verde/amarelo/vermelho)
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-300">3. Trend Analysis 📈</p>
                              <p className="text-xs text-slate-300">
                                Identifica se valor está subindo ou descendo
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-amber-300">4. Instant Feedback ⚡</p>
                              <p className="text-xs text-slate-300">
                                Feedback imediato após inserção
                              </p>
                            </div>
                          </div>
                        </>
                      }
                      position="bottom"
                      size="md"
                    />
                  </div>
                  <p className="text-sm text-slate-500">Inserir valores de métricas manualmente</p>

                  {/* Workspace & Stats Info */}
                  <div className="flex items-center gap-2 mt-3">
                    <InfoBadge
                      label={`Workspace: ${workspaceName}`}
                      color="slate"
                      icon={<Database className="h-3 w-3" />}
                    />
                    <InfoBadge
                      label={`${metrics.filter(m => m.isActive).length} métricas ativas`}
                      color="blue"
                    />
                    <InfoBadge
                      label={`${athletes.length} atletas`}
                      color="green"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsQuickEntryOpen(true)}
                    className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-400 hover:shadow-xl transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Quick Entry</h3>
                        <p className="text-xs text-slate-600">Inserir valor para 1 atleta</p>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsBulkEntryOpen(true)}
                    className="p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:border-purple-400 hover:shadow-xl transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Bulk Entry</h3>
                        <p className="text-xs text-slate-600">Inserir para múltiplos atletas</p>
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Info Card */}
                <div className="p-5 rounded-xl bg-blue-50 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Como usar</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Quick Entry:</strong> Inserir 1 valor para 1 atleta de cada vez</li>
                    <li>• <strong>Bulk Entry:</strong> Inserir valores para múltiplos atletas simultaneamente</li>
                    <li>• Valores são validados em tempo real vs baseline</li>
                    <li>• Sistema indica zonas (verde/amarelo/vermelho) automaticamente</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* FASE 2: Modals */}
      {/* CreateMetricModal removed - using WizardMain in App.tsx now */}
      <MetricHistoryDrawer
        metric={selectedMetric}
        athleteId={historyAthleteId}
        athleteName={athletes.find(a => a.id === historyAthleteId)?.name}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
      {/* FASE 3: Quick Entry Modal */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        onSave={handleQuickEntrySave}
        workspaceId={workspaceId}
        athletes={athletes}
        metrics={metrics}
      />
      {/* FASE 3: Bulk Entry Modal */}
      <BulkEntryModal
        isOpen={isBulkEntryOpen}
        onClose={() => setIsBulkEntryOpen(false)}
        onSave={handleBulkEntrySave}
        workspaceId={workspaceId}
        athletes={athletes}
        metrics={metrics}
      />
    </DataOSProvider>
  );
}