/**
 * 🎨 LIVE BOARD MAIN - ENHANCED
 * Real-time dashboard consolidado de atletas × métricas
 * 
 * MUDANÇAS RESPONSIVAS:
 * ✅ Header responsivo com botões adaptáveis
 * ✅ Stats grid responsivo (2 cols mobile, 4 cols desktop)
 * ✅ View tabs responsivos com scroll
 * ✅ Touch targets 44×44px
 * ✅ Borders suaves
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  User,
  BarChart3,
  RefreshCw,
  Download,
  Bell,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Users,
  LayoutGrid,
} from 'lucide-react';
import { ByAthleteView } from './ByAthleteView';
import { ByMetricView } from './ByMetricView';
import { ByAthleteCardsView } from './ByAthleteCardsView';
import type { Metric } from '@/types/metrics';
import { mockMetrics } from '@/lib/mockDataSprint0';
import { HelpTooltip, InfoBadge } from '@/components/shared/HelpTooltip';
import { EmptyState } from '@/components/shared/EmptyState';
import { useResponsive } from '@/hooks/useResponsive'; // 🎨 ENHANCED

interface LiveBoardMainProps {
  onViewMetricHistory?: (metricId: string) => void;
  onRefresh?: () => void;
  workspaceId?: string;
  workspaceName?: string;
}

type ViewMode = 'by-athlete' | 'by-metric' | 'cards';

// Mock athletes data
const mockAthletes = [
  { id: 'ath-1', name: 'João Silva', sport: 'Futebol', age: 24 },
  { id: 'ath-2', name: 'Maria Santos', sport: 'Atletismo', age: 22 },
  { id: 'ath-3', name: 'Pedro Costa', sport: 'Futebol', age: 26 },
  { id: 'ath-4', name: 'Ana Rodrigues', sport: 'Basquetebol', age: 23 },
  { id: 'ath-5', name: 'Carlos Mendes', sport: 'Futebol', age: 25 },
  { id: 'ath-6', name: 'Sofia Oliveira', sport: 'Atletismo', age: 21 },
  { id: 'ath-7', name: 'Miguel Ferreira', sport: 'Natação', age: 24 },
  { id: 'ath-8', name: 'Beatriz Alves', sport: 'Voleibol', age: 22 },
  { id: 'ath-9', name: 'Ricardo Pereira', sport: 'Futebol', age: 27 },
  { id: 'ath-10', name: 'Inês Martins', sport: 'Ginástica', age: 20 },
  { id: 'ath-11', name: 'Tiago Sousa', sport: 'Futebol', age: 23 },
  { id: 'ath-12', name: 'Catarina Lopes', sport: 'Atletismo', age: 24 },
];

// Mock metric values (will be generated dynamically in child components)
const mockMetricValues: any[] = [];

export function LiveBoardMain({ onViewMetricHistory, onRefresh, workspaceId, workspaceName }: LiveBoardMainProps) {
  // ✅ Day 10: Responsive hook
  const { isMobile, isTablet } = useResponsive();
  
  const [viewMode, setViewMode] = useState<ViewMode>('by-athlete');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Use real metrics from mock data
  const activeMetrics = useMemo(() => mockMetrics.filter((m) => m.isActive), []);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalCells = mockAthletes.length * activeMetrics.length;
    const filledCells = Math.floor(totalCells * 0.75); // 75% filled
    const alertsCount = Math.floor(mockAthletes.length * 0.15); // 15% alerts
    const completionRate = (filledCells / totalCells) * 100;

    return {
      totalAthletes: mockAthletes.length,
      totalMetrics: activeMetrics.length,
      totalCells,
      filledCells,
      alertsCount,
      completionRate,
    };
  }, [activeMetrics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
    onRefresh?.();
  };

  const handleUpdateValue = (athleteId: string, metricId: string, value: any) => {
    // TODO: Integrate with real data store
    alert(`✅ Valor guardado!\n\nAtleta: ${mockAthletes.find((a) => a.id === athleteId)?.name}\nMétrica: ${activeMetrics.find((m) => m.id === metricId)?.name}\nValor: ${value}`);
  };

  const viewModes = [
    { id: 'by-athlete' as ViewMode, label: 'Por Atleta', icon: User, description: 'Grid de atletas × métricas' },
    { id: 'by-metric' as ViewMode, label: 'Por Métrica', icon: BarChart3, description: 'Distribuição e análise' },
    { id: 'cards' as ViewMode, label: 'Cartões', icon: LayoutGrid, description: 'Visualização em cartões' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Live Board
              </h1>
              <HelpTooltip
                title="Live Board - Dashboard em Tempo Real"
                content={
                  <>
                    <p>Dashboard consolidado de todos os dados dos atletas:</p>
                    <ul className="mt-2 space-y-2">
                      <li>
                        <strong className="text-emerald-300">Por Atleta 👤</strong>
                        <p className="text-xs text-slate-300">Grid de atletas × métricas com valores atuais</p>
                      </li>
                      <li>
                        <strong className="text-sky-300">Por Métrica 📊</strong>
                        <p className="text-xs text-slate-300">Distribuição e análise estatística de cada métrica</p>
                      </li>
                      <li>
                        <strong className="text-violet-300">Cartões 📋</strong>
                        <p className="text-xs text-slate-300">Visualização em cartões para uma visão geral rápida</p>
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-amber-300 border-t border-slate-700 pt-2">
                      💡 Clica numa célula para editar inline ou ver histórico
                    </p>
                  </>
                }
                position="bottom"
              />
              <HelpTooltip
                title="🎯 Zonas de Valores"
                content={
                  <>
                    <p className="mb-2">Sistema automático de zonas baseado em baseline:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-lg">🟢</span>
                        <div>
                          <strong className="text-emerald-300">Verde</strong>
                          <p className="text-xs text-slate-300">Dentro do esperado (±10% baseline)</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lg">🟡</span>
                        <div>
                          <strong className="text-amber-300">Amarelo</strong>
                          <p className="text-xs text-slate-300">Atenção necessária (±20% baseline)</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-lg">🔴</span>
                        <div>
                          <strong className="text-red-300">Vermelho</strong>
                          <p className="text-xs text-slate-300">Fora do normal (&gt;20% baseline)</p>
                        </div>
                      </li>
                    </ul>
                  </>
                }
                position="bottom"
                size="md"
              />
              <HelpTooltip
                title="📊 Origem dos Dados"
                content={
                  <>
                    <p className="font-semibold mb-2">Dados vêm de 4 fontes:</p>
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
                      💡 Hover em cada célula para ver origem
                    </p>
                  </>
                }
                position="bottom"
                size="md"
              />
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Dashboard em tempo real de todos os dados
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Last Update */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>
                Atualizado há {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s
              </span>
            </div>

            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>

            {/* Export */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              <Download className="h-4 w-4" />
              Exportar
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              <Settings className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-200">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-sky-600" />
              <p className="text-xs text-slate-500">Atletas</p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{summaryStats.totalAthletes}</p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-slate-500">Métricas</p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{summaryStats.totalMetrics}</p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-white border border-violet-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-violet-600" />
              <p className="text-xs text-slate-500">Completude</p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{summaryStats.completionRate.toFixed(0)}%</p>
            <p className="text-xs text-violet-600">
              {summaryStats.filledCells} de {summaryStats.totalCells}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-slate-500">Alertas</p>
            </div>
            <p className="text-2xl font-semibold text-red-900">{summaryStats.alertsCount}</p>
            <p className="text-xs text-red-600">requerem atenção</p>
          </div>
        </div>

        {/* Workspace Info Bar */}
        {workspaceName && (
          <div className="px-4 py-2 mb-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <InfoBadge 
                label={`Workspace: ${workspaceName}`}
                color="slate"
                icon={<Database className="h-3 w-3" />}
              />
              <InfoBadge 
                label={`${summaryStats.totalAthletes} atletas`}
                color="blue"
                icon={<Users className="h-3 w-3" />}
              />
              <InfoBadge 
                label={`${summaryStats.completionRate.toFixed(0)}% completo`}
                color={summaryStats.completionRate >= 80 ? 'green' : summaryStats.completionRate >= 50 ? 'amber' : 'slate'}
              />
              {summaryStats.alertsCount > 0 && (
                <InfoBadge 
                  label={`${summaryStats.alertsCount} alertas`}
                  color="amber"
                />
              )}
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className={`flex gap-2 ${isMobile ? 'overflow-x-auto pb-2' : ''}`}>
          {viewModes.map((mode, index) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;

            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold">{mode.label}</div>
                  {!isActive && (
                    <div className="text-xs text-slate-500">{mode.description}</div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden bg-slate-50 p-6">
        {viewMode === 'by-athlete' && (
          <ByAthleteView
            athletes={mockAthletes}
            metrics={activeMetrics}
            values={mockMetricValues}
            onUpdateValue={handleUpdateValue}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        )}

        {viewMode === 'by-metric' && (
          <ByMetricView
            metrics={activeMetrics}
            athletes={mockAthletes}
            values={mockMetricValues}
            onViewDetails={onViewMetricHistory}
            onBulkUpdate={(metricId, athleteIds) => {
              alert(`📨 Enviar notificação para ${athleteIds.length} atletas sobre a métrica ${activeMetrics.find((m) => m.id === metricId)?.name}`);
            }}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        )}

        {viewMode === 'cards' && (
          <ByAthleteCardsView
            athletes={mockAthletes}
            metrics={activeMetrics}
            values={mockMetricValues}
            onUpdateValue={handleUpdateValue}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        )}
      </div>
      {/* Alerts Feed (Bottom Right) */}
      {summaryStats.alertsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl border-2 border-red-200 shadow-2xl z-40"
        >
          <div className="sticky top-0 bg-white border-b border-red-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-900">
                Alertas Ativos ({summaryStats.alertsCount})
              </h3>
            </div>
            <button className="text-xs text-red-600 hover:text-red-700">
              Ver Todos
            </button>
          </div>

          <div className="p-3 space-y-2">
            {Array.from({ length: Math.min(summaryStats.alertsCount, 5) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900 truncate">
                      {mockAthletes[i % mockAthletes.length].name}
                    </p>
                    <p className="text-xs text-red-700">
                      HRV abaixo do normal (45ms)
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Há 2 horas
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}