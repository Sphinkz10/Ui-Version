/**
 * 🎨 LIBRARY V2 - ENHANCED VERSION
 * 
 * MUDANÇAS VISUAIS IMPLEMENTADAS:
 * ✅ Mobile-first responsive grid (1/2/3/4 cols)
 * ✅ Tabs horizontais com scroll suave
 * ✅ Filters como drawer mobile (ResponsiveModal)
 * ✅ Details panel fullscreen mobile
 * ✅ Improved spacing e touch targets
 * ✅ Better visual hierarchy
 * ✅ Enhanced animations
 * 
 * @version Enhanced Post-Roadmap
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { DetailsPanel } from './DetailsPanel';
import { AdvancedFilters, type FilterState } from './AdvancedFilters';
import { MetricsGridView } from './MetricsGridView';
import { TemplatesSection } from './TemplatesSection';
import { MetricsList } from '../../MetricsList';
import { PacksLibraryModal } from '../../PacksLibraryModal';
import { ActivePacksSection } from '../../ActivePacksSection';

// Types
import type { Metric } from '@/types/metrics';
import type { ActivePack } from '@/types/packs';

// Shared
import { HelpTooltip, InfoBadge } from '@/components/shared/HelpTooltip';
import { EmptyState } from '@/components/shared/EmptyState';
import { useResponsive } from '@/hooks/useResponsive';
import { ResponsiveModal } from '@/components/shared/ResponsiveModal';

interface LibraryMainEnhancedProps {
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

export function LibraryMainEnhanced({ 
  onCreateMetric, 
  onCreate, 
  onEdit, 
  onDelete, 
  onViewHistory, 
  workspaceId = 'default-workspace',
  workspaceName = 'My Workspace'
}: LibraryMainEnhancedProps) {
  // 🎯 RESPONSIVE HOOK
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const [activeTab, setActiveTab] = useState<LibraryTab>('active');
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'grid' : 'list'); // 🎨 Auto grid on mobile
  const [packsModalOpen, setPacksModalOpen] = useState(false);
  
  // Details Panel state
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  
  // Filters state - NOW AS DRAWER ON MOBILE
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: 'all',
    source: 'all',
    usage: 'all',
    tags: [],
  });

  // Data state
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎨 RESPONSIVE GRID COLUMNS (enhanced)
  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return viewMode === 'grid' ? 3 : 1;
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Filter metrics
  const filteredMetrics = metrics.filter(m => {
    if (filters.status !== 'all' && m.status !== filters.status) return false;
    if (filters.category !== 'all' && m.category !== filters.category) return false;
    if (filters.source !== 'all' && m.source !== filters.source) return false;
    if (filters.tags.length > 0 && !filters.tags.some(tag => m.tags?.includes(tag))) return false;
    return true;
  });

  const orphanCount = metrics.filter(m => m.orphaned).length;

  // Tabs configuration
  const tabs = [
    { 
      id: 'templates' as LibraryTab, 
      label: isMobile ? 'Templates' : 'Meus Templates', // 🎨 Shorter on mobile
      icon: BookTemplate, 
      count: 4 
    },
    { 
      id: 'store' as LibraryTab, 
      label: isMobile ? 'Store' : 'Packs Store', // 🎨 Shorter on mobile
      icon: Store, 
      count: 0 
    },
    { 
      id: 'active' as LibraryTab, 
      label: isMobile ? 'Ativas' : 'Métricas Ativas', // 🎨 Shorter on mobile
      icon: Activity, 
      count: filteredMetrics.length 
    },
  ];

  // Handlers
  const handleMetricClick = (metric: Metric) => {
    setSelectedMetric(metric);
    setDetailsPanelOpen(true);
  };

  const handleEdit = (metric: Metric) => {
    onEdit?.(metric);
  };

  const handleDelete = async (metric: Metric) => {
    if (window.confirm(`Tem certeza que deseja eliminar "${metric.name}"?`)) {
      try {
        const response = await fetch(`/api/metrics/${metric.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete');
        toast.success('Métrica eliminada');
        fetchMetrics();
      } catch (err) {
        toast.error('Erro ao eliminar métrica');
      }
    }
  };

  const handleDuplicate = (metric: Metric) => {
    alert(`🔄 Duplicando métrica: ${metric.name}\n\nEsta funcionalidade criará uma cópia da métrica com o prefixo "Cópia de..."`);
  };

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
    <div className="flex h-full flex-col lg:flex-row"> {/* 🎨 Flex col on mobile */}
      {/* 🎨 MOBILE: Filters as Modal Drawer */}
      {isMobile && (
        <ResponsiveModal
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filtros"
        >
          <div className="p-4">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({
                status: 'all',
                category: 'all',
                source: 'all',
                usage: 'all',
                tags: [],
              })}
            />
          </div>
        </ResponsiveModal>
      )}
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 🎨 ENHANCED HEADER - Better spacing on mobile */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white">
          
          {/* Title & Actions */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {isMobile ? '📚 Library' : '📚 Metrics Library'}
                  </h1>
                  {!isMobile && (
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
                        </>
                      }
                      position="bottom"
                    />
                  )}
                </div>
                {!isMobile && (
                  <p className="text-sm text-slate-600 mt-1">
                    Templates, Packs e Métricas Ativas
                  </p>
                )}
              </div>
            </div>

            {/* 🎨 CREATE BUTTON - Larger touch target on mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateMetric}
              className={`flex items-center gap-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-sky-500 transition-all ${
                isMobile ? 'p-3 min-h-[44px]' : 'px-4 py-2'
              }`}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {!isMobile && <span>Nova Métrica</span>}
            </motion.button>
          </div>

          {/* 🎨 TABS - Horizontal scroll on mobile with better touch targets */}
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
                    <span className={isMobile ? 'text-xs' : ''}>{tab.label}</span>
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

            {/* 🎨 VIEW MODE & FILTERS - Better mobile UX */}
            {activeTab === 'active' && (
              <div className="flex gap-2 shrink-0">
                {/* View Mode Toggle - Hide on mobile (always grid) */}
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

                {/* 🎨 FILTERS BUTTON - Larger touch target on mobile */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`flex items-center gap-2 text-sm font-semibold rounded-xl transition-all ${
                    isMobile ? 'p-3 min-h-[44px]' : 'px-3 py-2'
                  } ${
                    filtersOpen
                      ? 'bg-sky-100 border-2 border-sky-400 text-sky-700'
                      : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {filtersOpen ? <X className="h-4 w-4" /> : <FilterIcon className="h-4 w-4" />}
                  {!isMobile && <span>Filtros</span>}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* 🎨 WORKSPACE INFO BAR - Scrollable on mobile */}
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
                  {(filters.status !== 'all' || filters.category !== 'all' || filters.tags.length > 0) && (
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

        {/* 🎨 CONTENT - Better mobile layout */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          <div className="flex h-full">
            
            {/* Main Content Area */}
            <div className={`flex-1 overflow-y-auto ${!isMobile && filtersOpen && activeTab === 'active' ? 'pr-0' : ''}`}>
              
              {/* 🎨 TEMPLATES TAB */}
              {activeTab === 'templates' && (
                <div className="p-4 sm:p-6">
                  <TemplatesSection
                    onCreateMetric={onCreateMetric}
                    onUseTemplate={(template) => {
                      toast.success(`✨ Usando template: ${template.name}`);
                      onCreateMetric();
                    }}
                    onEditTemplate={(template) => {
                      toast.info(`✏️ Editar template: ${template.name}`);
                    }}
                    onDeleteTemplate={(template) => {
                      if (window.confirm(`Eliminar template "${template.name}"?`)) {
                        toast.success('Template eliminado');
                      }
                    }}
                  />
                </div>
              )}

              {/* 🎨 STORE TAB */}
              {activeTab === 'store' && (
                <div className="p-4 sm:p-6">
                  <ActivePacksSection
                    packs={mockActivePacks}
                    onDeactivate={(pack) => {
                      if (window.confirm(`Desativar pack "${pack.packName}"?`)) {
                        toast.success('Pack desativado');
                      }
                    }}
                    onViewDetails={(pack) => {
                      toast.info(`📦 Detalhes: ${pack.packName}`);
                    }}
                  />

                  <div className="mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPacksModalOpen(true)}
                      className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-400 bg-white hover:bg-sky-50/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <Store className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-900 mb-1">Explorar Store</h3>
                          <p className="text-sm text-slate-600">
                            Descobre packs prontos da comunidade
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* 🎨 ACTIVE TAB */}
              {activeTab === 'active' && (
                <div className="p-4 sm:p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="h-8 w-8 text-sky-500 animate-spin" />
                        <p className="text-sm text-slate-600">A carregar métricas...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <p className="font-semibold text-slate-900">Erro ao carregar</p>
                        <p className="text-sm text-slate-600 max-w-md">{error}</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={fetchMetrics}
                          className="mt-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors"
                        >
                          Tentar novamente
                        </motion.button>
                      </div>
                    </div>
                  ) : filteredMetrics.length === 0 ? (
                    <EmptyState
                      icon={Activity}
                      title="Nenhuma métrica ativa"
                      description="Começa por criar uma métrica ou ativar um pack da store."
                      action={{
                        label: 'Nova Métrica',
                        onClick: onCreateMetric,
                      }}
                    />
                  ) : (
                    <>
                      {/* 🎨 RESPONSIVE GRID VIEW */}
                      {viewMode === 'grid' ? (
                        <MetricsGridView
                          metrics={filteredMetrics}
                          onMetricClick={handleMetricClick}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          columns={getGridColumns()} // Dynamic columns
                        />
                      ) : (
                        <MetricsList
                          metrics={filteredMetrics}
                          onMetricClick={handleMetricClick}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 🎨 DESKTOP: Filters Sidebar */}
            <AnimatePresence>
              {!isMobile && filtersOpen && activeTab === 'active' && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-l border-slate-200 bg-white overflow-hidden"
                >
                  <div className="p-6 h-full overflow-y-auto">
                    <AdvancedFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      onReset={() => setFilters({
                        status: 'all',
                        category: 'all',
                        source: 'all',
                        usage: 'all',
                        tags: [],
                      })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* 🎨 DETAILS PANEL - Fullscreen on mobile */}
      <AnimatePresence>
        {detailsPanelOpen && selectedMetric && (
          <DetailsPanel
            metric={selectedMetric}
            isOpen={detailsPanelOpen}
            onClose={() => {
              setDetailsPanelOpen(false);
              setSelectedMetric(null);
            }}
            onEdit={() => {
              handleEdit(selectedMetric);
              setDetailsPanelOpen(false);
            }}
            onDelete={() => {
              handleDelete(selectedMetric);
              setDetailsPanelOpen(false);
            }}
            onDuplicate={() => {
              handleDuplicate(selectedMetric);
            }}
            onViewHistory={() => {
              onViewHistory?.(selectedMetric);
              setDetailsPanelOpen(false);
            }}
          />
        )}
      </AnimatePresence>
      {/* Packs Library Modal */}
      {packsModalOpen && (
        <PacksLibraryModal
          isOpen={packsModalOpen}
          onClose={() => setPacksModalOpen(false)}
          onActivatePack={(pack) => {
            toast.success(`✨ Pack "${pack.name}" ativado!`);
            setPacksModalOpen(false);
            fetchMetrics();
          }}
        />
      )}
    </div>
  );
}
