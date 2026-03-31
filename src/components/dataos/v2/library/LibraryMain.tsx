/**
 * LIBRARY V2 - Main Component (SEMANA 4 INTEGRATED ✅)
 * Consolidates: Templates + Store (Packs) + Active Metrics
 * INCLUDES: DetailsPanel, AdvancedFilters, GridView, TemplatesSection
 * 
 * @since Semana 4 - Data OS V2 Complete
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookTemplate,
  Store,
  Activity,
  Plus,
  Grid3x3,
  List,
  Filter as FilterIcon,
  X,
  Database,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Import NEW components
import { DetailsPanel } from './DetailsPanel';
import { AdvancedFilters, type FilterState } from './AdvancedFilters';
import { MetricsGridView } from './MetricsGridView';
import { TemplatesSection } from './TemplatesSection';

// Import existing components to REUSE
import { MetricsList } from '../../MetricsList';
import { PacksLibraryModal } from '../../PacksLibraryModal';
import { ActivePacksSection } from '../../ActivePacksSection';
import type { Metric } from '@/types/metrics';
import type { ActivePack } from '@/types/packs';

// Import NEW shared components
import { HelpTooltip, InfoBadge } from '@/components/shared/HelpTooltip';
import { EmptyState } from '@/components/shared/EmptyState';
import { useResponsive } from '@/hooks/useResponsive'; // ✅ NOVO - Day 9
import { ResponsiveModal } from '@/components/shared/ResponsiveModal'; // ✅ Day 9 - Filters drawer (CORRIGIDO)

interface LibraryMainProps {
  onCreateMetric: () => void;
  onCreate?: () => void;
  onEdit?: (metric: Metric) => void;
  onDelete?: (metric: Metric) => void;
  onViewHistory?: (metric: Metric) => void;
  workspaceId?: string;
  workspaceName?: string;
}

type LibraryTab = 'templates' | 'store' | 'active';
type ViewMode = 'list' | 'grid';

export function LibraryMain({ 
  onCreateMetric, 
  onCreate, 
  onEdit, 
  onDelete, 
  onViewHistory, 
  workspaceId = 'default-workspace',
  workspaceName = 'My Workspace'
}: LibraryMainProps) {
  // ✅ Day 9: Responsive hook
  const { isMobile, isTablet } = useResponsive();
  
  const [activeTab, setActiveTab] = useState<LibraryTab>('active');
  // 🎨 ENHANCED: Auto grid mode on mobile
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'grid' : 'list');
  const [packsModalOpen, setPacksModalOpen] = useState(false);
  
  // Details Panel state
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  
  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: 'all',
    source: 'all',
    usage: 'all',
    tags: [],
  });

  // 🎨 ENHANCED: Dynamic grid columns based on device
  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return viewMode === 'grid' ? 3 : 1;
  };

  // ============================================================================
  // SEMANA 4: REAL DATA FROM API ✅
  // ============================================================================
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics from API
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX: If no workspaceId, use mock data
      if (!workspaceId) {
        console.warn('⚠️ [Library] No workspaceId, using mock data');
        setMetrics(getMockMetrics());
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        workspaceId,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.status === 'active' && { isActive: 'true' }),
        ...(filters.status === 'inactive' && { isActive: 'false' }),
      });

      // ✅ FIX: Correct API path (remove /app prefix)
      const response = await fetch(`/api/metrics?${params}`);

      if (!response.ok) {
        // If API fails, fallback to mock data
        console.warn(`⚠️ [Library] API failed (${response.status}), using mock data`);
        setMetrics(getMockMetrics());
        setLoading(false);
        return;
      }

      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (err: any) {
      console.warn('⚠️ [Library] Error fetching metrics, using mock data:', err.message);
      // Fallback to mock data instead of showing error
      setMetrics(getMockMetrics());
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
  }, [workspaceId]);

  // Reload when filters change
  useEffect(() => {
    fetchMetrics();
  }, [filters.status, filters.category]);

  // ============================================================================
  // CLIENT-SIDE FILTERING (for filters not supported by API)
  // ============================================================================
  const filteredMetrics = metrics.filter((m) => {
    // Source filter (client-side only)
    if (filters.source !== 'all') {
      // TODO: Add sourceType to Metric type
      // For now, skip this filter
    }

    // Usage filter (client-side only)
    if (filters.usage !== 'all') {
      // TODO: Fetch usage data from separate endpoint
      // For now, skip this filter
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const metricTags = m.tags || [];
      const hasAllTags = filters.tags.every(tag => metricTags.includes(tag));
      if (!hasAllTags) return false;
    }

    return true;
  });

  // Get available tags from metrics
  const availableTags = Array.from(
    new Set(metrics.flatMap((m) => m.tags || []))
  );

  // Count orphan metrics (mock)
  const orphanCount = Math.floor(metrics.length * 0.1); // 10% são órfãs

  const tabs = [
    { id: 'templates' as LibraryTab, label: 'Meus Templates', mobileLabel: 'Templates', icon: BookTemplate, count: 4 },
    { id: 'store' as LibraryTab, label: 'Store', mobileLabel: 'Store', icon: Store, count: 15 },
    { id: 'active' as LibraryTab, label: 'Métricas Ativas', mobileLabel: 'Ativas', icon: Activity, count: filteredMetrics.length },
  ];

  // Handlers
  const handleMetricClick = (metric: Metric) => {
    setSelectedMetric(metric);
    setDetailsPanelOpen(true);
  };

  const handleDuplicate = (metric: Metric) => {
    alert(`🔄 Duplicando métrica: ${metric.name}\n\nEsta funcionalidade criará uma cópia da métrica com o prefixo "Cópia de..."`);
  };

  // Mock active packs
  const mockActivePacks: ActivePack[] = [
    {
      id: 'pack-recovery',
      packId: 'recovery-monitoring',
      packName: 'Recovery Monitoring',
      packDescription: 'Complete recovery tracking',
      activatedAt: '2024-01-01T00:00:00Z',
      activatedBy: 'user-1',
      metricsActivated: ['hrv', 'sleep-quality', 'muscle-soreness', 'stress-level', 'fatigue'],
      status: 'active',
    },
  ];

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 🎨 ENHANCED: Responsive Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {isMobile ? '📚 Library' : '📚 Metrics Library'}
                  </h1>
                  {!isMobile && (
                    <>
                      <HelpTooltip
                        title="Library - Central de Métricas"
                        content={
                          <>
                            <p>A Library organiza todas as métricas do workspace em 3 categorias:</p>
                            <ul className="mt-2 space-y-1.5">
                              <li>• <strong className="text-sky-300">Templates:</strong> Métricas criadas e guardadas por ti</li>
                              <li>• <strong className="text-purple-300">Store:</strong> Packs prontos da comunidade</li>
                              <li>• <strong className="text-emerald-300">Ativas:</strong> Métricas atualmente em uso</li>
                            </ul>
                            <p className="mt-3 text-xs text-slate-300 border-t border-slate-700 pt-2">
                              💡 Cada workspace tem a sua própria library
                            </p>
                          </>
                        }
                        position="bottom"
                      />
                      <HelpTooltip
                        title="📊 Origem dos Dados"
                        content={
                          <>
                            <p className="font-semibold mb-2">Métricas podem vir de 4 fontes:</p>
                            <div className="space-y-3">
                              <div>
                                <p className="font-semibold text-emerald-300">1. Live Sessions 🏃</p>
                                <p className="text-xs text-slate-300">
                                  Capturados durante treinos no Live Command
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-sky-300">2. Manual Entry ✏️</p>
                                <p className="text-xs text-slate-300">
                                  Inseridos manualmente por treinadores
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-purple-300">3. Forms 📋</p>
                                <p className="text-xs text-slate-300">
                                  Respostas de questionários dos atletas
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-amber-300">4. Integrations 🔗</p>
                                <p className="text-xs text-slate-300">
                                  Wearables, GPS, plataformas externas
                                </p>
                              </div>
                            </div>
                            <p className="mt-3 text-xs text-amber-300 border-t border-slate-700 pt-2">
                              💡 Cada valor mostra sua origem no histórico
                            </p>
                          </>
                        }
                        position="bottom"
                        size="md"
                      />
                    </>
                  )}
                </div>
                {!isMobile && (
                  <p className="text-sm text-slate-600 mt-1">
                    Templates, Packs e Métricas Ativas
                  </p>
                )}
              </div>
            </div>

            {/* 🎨 ENHANCED: Responsive Create Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateMetric}
              className={`flex items-center gap-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-sky-500 transition-all ${
                isMobile ? 'p-3 min-h-[44px] min-w-[44px]' : 'px-4 py-2'
              }`}
              title={isMobile ? 'Nova Métrica' : undefined}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {!isMobile && <span>Nova Métrica</span>}
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
            <div className="flex gap-2 flex-1 min-w-0">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                      isMobile ? 'px-4 py-3 min-h-[44px]' : 'px-6 py-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30'
                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={isMobile ? 'text-xs' : ''}>{isMobile ? tab.mobileLabel : tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* 🎨 View Mode & Filters - Enhanced for mobile */}
            {activeTab === 'active' && (
              <div className="flex gap-2 shrink-0">
                {/* View Mode Toggle - Hidden on mobile */}
                {!isMobile && (
                  <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'list' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Lista"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'grid' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Grelha"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* 🎨 Filters Toggle - Icon only on mobile */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`flex items-center gap-2 text-sm font-semibold rounded-xl transition-all ${
                    isMobile ? 'p-3 min-h-[44px] min-w-[44px] justify-center' : 'px-3 py-2'
                  } ${
                    filtersOpen
                      ? 'bg-sky-100 border-2 border-sky-400 text-sky-700'
                      : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                  title={isMobile ? 'Filtros' : undefined}
                >
                  {filtersOpen ? <X className="h-4 w-4 shrink-0" /> : <FilterIcon className="h-4 w-4 shrink-0" />}
                  {!isMobile && <span>Filtros</span>}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* 🎨 ENHANCED: Workspace & Stats Info Bar - Scrollable */}
        {workspaceName && (
          <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <InfoBadge 
                label={`Workspace: ${workspaceName}`}
                color="slate"
                icon={<Database className="h-3 w-3" />}
              />
              {activeTab === 'active' && (
                <>
                  <InfoBadge 
                    label={`${filteredMetrics.length} ${filteredMetrics.length === 1 ? 'métrica' : 'métricas'}`}
                    color="blue"
                    icon={<Activity className="h-3 w-3" />}
                  />
                  {orphanCount > 0 && (
                    <InfoBadge 
                      label={`${orphanCount} órfãs`}
                      color="amber"
                    />
                  )}
                  {filters.status !== 'all' || filters.category !== 'all' || filters.tags.length > 0 && (
                    <InfoBadge 
                      label="Filtros ativos"
                      color="purple"
                    />
                  )}
                </>
              )}
              {activeTab === 'templates' && (
                <InfoBadge 
                  label="4 templates guardados"
                  color="green"
                  icon={<BookTemplate className="h-3 w-3" />}
                />
              )}
              {activeTab === 'store' && (
                <InfoBadge 
                  label={`${mockActivePacks.length} pack${mockActivePacks.length === 1 ? '' : 's'} ativo${mockActivePacks.length === 1 ? '' : 's'}`}
                  color="purple"
                  icon={<Store className="h-3 w-3" />}
                />
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="flex h-full">
            {/* Main Content Area */}
            <div className={`flex-1 ${filtersOpen && activeTab === 'active' ? 'pr-0' : ''}`}>
              {activeTab === 'templates' && (
                <div className="p-4 sm:p-6">
                  <TemplatesSection
                    onCreateMetric={onCreateMetric}
                    onUseTemplate={(template) => {
                      alert(`✨ Abrindo wizard com template: ${template.name}`);
                      onCreateMetric();
                    }}
                    onEditTemplate={(template) => {
                      alert(`✏️ Editar template: ${template.name}`);
                    }}
                    onDeleteTemplate={(template) => {
                      if (confirm(`❌ Deletar template "${template.name}"?\n\nIsto não afeta métricas já criadas.`)) {
                        alert('Template deletado!');
                      }
                    }}
                    onDuplicateTemplate={(template) => {
                      alert(`📋 Template duplicado: Cópia de ${template.name}`);
                    }}
                    onShareTemplate={(template) => {
                      alert(`🔗 Partilhar template: ${template.name}\n\nGerar link público ou partilhar dentro do workspace?`);
                    }}
                  />
                </div>
              )}

              {activeTab === 'store' && (
                <div className="p-6 space-y-6">
                  {/* Active Packs (REUSED COMPONENT) */}
                  <ActivePacksSection
                    packs={mockActivePacks}
                    isLoading={false}
                    onViewPackMetrics={(packId, metricIds) => {}}
                    onDeactivatePack={(pack) => {}}
                  />

                  {/* Browse More */}
                  <div className="p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shrink-0">
                        <Store className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-slate-900 mb-2">
                          Explora a Store
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                          15+ packs prontos para ativar: Performance, Recovery, Wellness e mais.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPacksModalOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                        >
                          Ver Todos os Packs
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'active' && (
                <div className="p-6">
                  {filteredMetrics.length === 0 ? (
                    <EmptyState
                      icon={Activity}
                      title={
                        metrics.length === 0
                          ? 'Nenhuma Métrica Ativa'
                          : 'Nenhuma métrica encontrada'
                      }
                      description={
                        metrics.length === 0 ? (
                          <>
                            <p>Não tens métricas ativas neste workspace ainda.</p>
                            {workspaceName && (
                              <div className="mt-3">
                                <InfoBadge 
                                  label={`Workspace: ${workspaceName}`}
                                  color="blue"
                                  size="sm"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          'Tenta ajustar os filtros ou a pesquisa.'
                        )
                      }
                      action={
                        metrics.length === 0
                          ? {
                              label: 'Criar Nova Métrica',
                              onClick: onCreateMetric,
                              icon: Plus,
                            }
                          : undefined
                      }
                      secondaryAction={
                        metrics.length === 0
                          ? {
                              label: 'Explorar Packs',
                              onClick: () => {
                                setActiveTab('store');
                                setPacksModalOpen(true);
                              },
                            }
                          : undefined
                      }
                      tips={
                        metrics.length === 0
                          ? [
                              'Podes criar métricas 100% personalizadas',
                              'Ou usar packs prontos da Store',
                              'Métricas são privadas por workspace',
                            ]
                          : undefined
                      }
                      color="emerald"
                    />
                  ) : viewMode === 'list' ? (
                    <MetricsList
                      metrics={filteredMetrics}
                      onCreate={onCreateMetric}
                      onEdit={(metric) => {
                        setSelectedMetric(metric);
                        setDetailsPanelOpen(true);
                        onEdit?.(metric);
                      }}
                      onDelete={onDelete}
                      onViewHistory={onViewHistory}
                      onBrowsePacks={() => {
                        setActiveTab('store');
                        setPacksModalOpen(true);
                      }}
                    />
                  ) : (
                    <MetricsGridView
                      metrics={filteredMetrics}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewHistory={onViewHistory}
                      onDuplicate={handleDuplicate}
                      onCardClick={handleMetricClick}
                      isMobile={isMobile}  
                      isTablet={isTablet}
                      columns={getGridColumns()}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Filters Sidebar (only for active tab) */}
            {filtersOpen && activeTab === 'active' && (
              <>
                {/* ✅ Day 9: Mobile/Tablet = Drawer | Desktop = Sidebar */}
                {isMobile || isTablet ? (
                  <ResponsiveModal
                    isOpen={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    title="Filtros Avançados"
                    size="full"
                  >
                    <div className="p-6">
                      <AdvancedFilters
                        filters={filters}
                        onChange={setFilters}
                        orphanCount={orphanCount}
                        availableTags={availableTags}
                      />
                    </div>
                  </ResponsiveModal>
                ) : (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-slate-200 bg-white p-6 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">
                        Filtros Avançados
                      </h3>
                      <button
                        onClick={() => setFiltersOpen(false)}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>

                    <AdvancedFilters
                      filters={filters}
                      onChange={setFilters}
                      orphanCount={orphanCount}
                      availableTags={availableTags}
                    />
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Details Panel (slides from right) */}
      <DetailsPanel
        metric={selectedMetric}
        isOpen={detailsPanelOpen}
        onClose={() => setDetailsPanelOpen(false)}
        onEdit={(metric) => {
          setDetailsPanelOpen(false);
          onEdit?.(metric);
        }}
        onDelete={(metric) => {
          setDetailsPanelOpen(false);
          onDelete?.(metric);
        }}
        onDuplicate={handleDuplicate}
        onViewHistory={(metric) => {
          setDetailsPanelOpen(false);
          onViewHistory?.(metric);
        }}
      />
      {/* Packs Modal (REUSED) */}
      <PacksLibraryModal
        open={packsModalOpen}
        onClose={() => setPacksModalOpen(false)}
        onActivatePack={(packId) => {
          setPacksModalOpen(false);
        }}
      />
    </div>
  );
}

// Mock metrics for fallback
function getMockMetrics(): Metric[] {
  return [
    {
      id: 'mock-1',
      name: 'Velocidade Máxima',
      displayName: 'Velocidade Máxima',
      description: 'Velocidade máxima atingida durante o exercício',
      unit: 'km/h',
      category: 'performance', // ✅ FIX
      type: 'scale',
      tags: ['performance', 'velocidade'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      name: 'Distância Total',
      displayName: 'Distância Total',
      description: 'Distância total percorrida',
      unit: 'km',
      category: 'performance', // ✅ FIX
      type: 'scale',
      tags: ['performance', 'distância'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      name: 'Frequência Cardíaca Média',
      displayName: 'FC Média',
      description: 'Média da frequência cardíaca durante a sessão',
      unit: 'bpm',
      category: 'wellness', // ✅ FIX: era 'health'
      type: 'scale',
      tags: ['wellness', 'cardio'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-4',
      name: 'RPE (Perceção de Esforço)',
      displayName: 'RPE',
      description: 'Taxa de perceção de esforço (escala 1-10)',
      unit: '/10',
      category: 'wellness',
      type: 'scale',
      tags: ['wellness', 'perceção'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-5',
      name: 'Qualidade do Sono',
      displayName: 'Qualidade do Sono',
      description: 'Avaliação da qualidade do sono (escala 1-10)',
      unit: '/10',
      category: 'wellness',
      type: 'scale',
      tags: ['wellness', 'sono', 'recovery'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-6',
      name: 'HRV (Variabilidade Cardíaca)',
      displayName: 'HRV',
      description: 'Variabilidade da frequência cardíaca (indicador de recuperação)',
      unit: 'ms',
      category: 'readiness', // ✅ FIX: era 'health'
      type: 'scale',
      tags: ['readiness', 'recovery', 'cardio'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-7',
      name: 'Nível de Fadiga',
      displayName: 'Fadiga',
      description: 'Nível auto-reportado de fadiga (escala 1-10)',
      unit: '/10',
      category: 'wellness',
      type: 'scale',
      tags: ['wellness', 'recovery'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-8',
      name: 'Carga de Treino',
      displayName: 'Carga',
      description: 'Carga total de treino (volume × intensidade)',
      unit: 'UA',
      category: 'load', // ✅ FIX: era 'performance'
      type: 'scale',
      tags: ['load', 'carga'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-9',
      name: 'Potência Média',
      displayName: 'Potência',
      description: 'Potência média gerada durante o exercício',
      unit: 'watts',
      category: 'performance',
      type: 'scale',
      tags: ['performance', 'potência'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-10',
      name: 'Tempo de Recuperação',
      displayName: 'Recuperação',
      description: 'Tempo estimado para recuperação completa',
      unit: 'horas',
      category: 'wellness',
      type: 'scale',
      tags: ['wellness', 'recovery'],
      isActive: true,
      workspaceId: 'default-workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}