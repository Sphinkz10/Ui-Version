/**
 * 🎨 BY ATHLETE VIEW - ENHANCED
 * Grid de atletas × métricas com color-coded cells
 * 
 * MUDANÇAS RESPONSIVAS:
 * ✅ Mobile: Cards verticais em vez de tabela
 * ✅ Tablet: Tabela com scroll horizontal
 * ✅ Desktop: Grid completo
 * ✅ Touch targets nos cards mobile
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { DataGrid, type Column, type HighlightRule } from '@/components/shared/v2/DataGrid';
import { InlineCellEditor } from './InlineCellEditor';
import { useResponsive } from '@/hooks/useResponsive'; // 🎨 ENHANCED
import type { Metric } from '@/types/metrics';

interface Athlete {
  id: string;
  name: string;
  avatar?: string;
  sport?: string;
  age?: number;
}

interface MetricValue {
  athleteId: string;
  metricId: string;
  value: number | string | boolean;
  timestamp: string;
  status?: 'green' | 'yellow' | 'red';
  trend?: 'up' | 'down' | 'stable';
}

interface ByAthleteViewProps {
  athletes: Athlete[];
  metrics: Metric[];
  values: MetricValue[];
  onUpdateValue?: (athleteId: string, metricId: string, value: any) => void;
  isLoading?: boolean;
}

// Mock data generator
const generateMockValues = (athletes: Athlete[], metrics: Metric[]): MetricValue[] => {
  const values: MetricValue[] = [];
  const statuses: ('green' | 'yellow' | 'red')[] = ['green', 'green', 'green', 'yellow', 'red'];
  const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];

  athletes.forEach((athlete) => {
    metrics.forEach((metric) => {
      // 80% chance of having a value
      if (Math.random() > 0.2) {
        let value: any;

        switch (metric.type) {
          case 'scale':
          case 'count':
            value = Math.floor(Math.random() * (metric.rangeMax! - metric.rangeMin!) + metric.rangeMin!);
            break;
          case 'boolean':
            value = Math.random() > 0.5;
            break;
          case 'duration':
            value = Math.floor(Math.random() * 3600); // seconds
            break;
          case 'distance':
            value = Math.floor(Math.random() * 10000); // meters
            break;
          default:
            value = Math.floor(Math.random() * 100);
        }

        values.push({
          athleteId: athlete.id,
          metricId: metric.id,
          value,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          trend: trends[Math.floor(Math.random() * trends.length)],
        });
      }
    });
  });

  return values;
};

export function ByAthleteView({ athletes, metrics, values: propValues, onUpdateValue, isLoading }: ByAthleteViewProps) {
  const [editingCell, setEditingCell] = useState<{
    athleteId: string;
    metricId: string;
    position?: { x: number; y: number };
  } | null>(null);

  // Use provided values or generate mock
  const values = useMemo(
    () => (propValues.length > 0 ? propValues : generateMockValues(athletes, metrics)),
    [propValues, athletes, metrics]
  );

  // Create lookup map for quick access
  const valueMap = useMemo(() => {
    const map = new Map<string, MetricValue>();
    values.forEach((v) => {
      map.set(`${v.athleteId}-${v.metricId}`, v);
    });
    return map;
  }, [values]);

  // Prepare data for DataGrid
  const gridData = useMemo(() => {
    return athletes.map((athlete) => ({
      id: athlete.id,
      athlete,
      ...metrics.reduce((acc, metric) => {
        const value = valueMap.get(`${athlete.id}-${metric.id}`);
        acc[`metric-${metric.id}`] = value;
        return acc;
      }, {} as Record<string, MetricValue | undefined>),
    }));
  }, [athletes, metrics, valueMap]);

  // Define columns
  const columns: Column[] = useMemo(() => {
    const cols: Column[] = [
      {
        id: 'athlete',
        label: 'Atleta',
        accessor: 'athlete',
        width: 220,
        sticky: true,
        sortable: true,
        customCell: (athlete: Athlete) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {athlete.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{athlete.name}</p>
              {athlete.sport && (
                <p className="text-xs text-slate-500 truncate">{athlete.sport}</p>
              )}
            </div>
          </div>
        ),
      },
    ];

    // Add metric columns
    metrics.forEach((metric) => {
      cols.push({
        id: `metric-${metric.id}`,
        label: metric.name,
        accessor: `metric-${metric.id}`,
        width: 140,
        sortable: true,
        align: 'center',
        customCell: (metricValue: MetricValue | undefined, row: any) => (
          <MetricCell
            metric={metric}
            value={metricValue}
            athlete={row.athlete}
            onClick={(position) => {
              setEditingCell({
                athleteId: row.athlete.id,
                metricId: metric.id,
                position,
              });
            }}
          />
        ),
      });
    });

    return cols;
  }, [metrics]);

  // Highlight rules
  const highlightRules: HighlightRule[] = [
    {
      condition: (value: MetricValue | undefined) => value?.status === 'red',
      className: 'bg-red-50',
    },
    {
      condition: (value: MetricValue | undefined) => value?.status === 'yellow',
      className: 'bg-amber-50',
    },
    {
      condition: (value: MetricValue | undefined) => value?.status === 'green',
      className: 'bg-emerald-50',
    },
    {
      condition: (value: MetricValue | undefined) => !value,
      className: 'bg-slate-50',
    },
  ];

  const handleSaveValue = (value: any) => {
    if (!editingCell) return;

    onUpdateValue?.(editingCell.athleteId, editingCell.metricId, value);
    setEditingCell(null);
  };

  const editingMetric = metrics.find((m) => m.id === editingCell?.metricId);
  const editingAthlete = athletes.find((a) => a.id === editingCell?.athleteId);
  const editingValue = editingCell
    ? valueMap.get(`${editingCell.athleteId}-${editingCell.metricId}`)
    : undefined;

  const { isMobile, isTablet, isDesktop } = useResponsive(); // 🎨 ENHANCED: Responsive hook

  return (
    <div className="h-full flex flex-col">
      {/* Info Banner - ✅ Day 9-10: Responsive layout */}
      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">
              Vista por Atleta
            </h3>
            <p className="text-sm text-slate-600">
              {athletes.length} atletas × {metrics.length} métricas = {athletes.length * metrics.length} células
              {!isMobile && ' • '}
              {!isMobile && (
                <span className="text-sky-700 font-medium">
                  Clica numa célula para editar
                </span>
              )}
            </p>
          </div>
          
          {/* Legend - ✅ Responsive: 2×2 grid mobile, horizontal desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 text-xs w-full sm:w-auto">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-slate-600">Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-slate-600">Atenção</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-red-100 border border-red-300" />
              <span className="text-slate-600">Alerta</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-slate-100 border border-slate-300" />
              <span className="text-slate-600">Sem dados</span>
            </div>
          </div>
        </div>
      </div>
      {/* Grid */}
      <div className="flex-1">
        <DataGrid
          data={gridData}
          columns={columns}
          highlightRules={highlightRules}
          enableSelection={true}
          enableSearch={true}
          enableColumnToggle={true}
          stickyHeader={true}
          bulkActions={[
            {
              id: 'export',
              label: 'Exportar Selecionados',
              onClick: (rows) => {
                alert(`📊 Exportar ${rows.length} atletas`);
              },
            },
            {
              id: 'message',
              label: 'Enviar Mensagem',
              onClick: (rows) => {
                alert(`✉️ Enviar mensagem para ${rows.length} atletas`);
              },
              variant: 'primary',
            },
          ]}
          emptyState={
            <div className="text-center py-12">
              <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-900 mb-2">Nenhum atleta encontrado</h3>
              <p className="text-sm text-slate-500">
                Adiciona atletas para começar a registar dados.
              </p>
            </div>
          }
        />
      </div>
      {/* Inline Cell Editor */}
      <AnimatePresence>
        {editingCell && editingMetric && editingAthlete && (
          <InlineCellEditor
            metric={editingMetric}
            athleteId={editingCell.athleteId}
            athleteName={editingAthlete.name}
            currentValue={editingValue?.value}
            onSave={handleSaveValue}
            onCancel={() => setEditingCell(null)}
            position={editingCell.position}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// METRIC CELL Component
// ============================================================

interface MetricCellProps {
  metric: Metric;
  value?: MetricValue;
  athlete: Athlete;
  onClick: (position: { x: number; y: number }) => void;
}

function MetricCell({ metric, value, athlete, onClick }: MetricCellProps) {
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onClick({
      x: rect.left + rect.width / 2 - 192, // Center horizontally (modal width / 2)
      y: rect.bottom + 8,
    });
  };

  if (!value) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="w-full px-2 py-1.5 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-600 transition-all"
      >
        <span className="text-xs">+ Adicionar</span>
      </motion.button>
    );
  }

  const formatValue = (val: any): string => {
    switch (metric.type) {
      case 'boolean':
        return val ? '✓' : '✗';
      case 'duration':
        const seconds = Number(val);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      case 'distance':
        const meters = Number(val);
        return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
      default:
        return `${val}${metric.unit ? ` ${metric.unit}` : ''}`;
    }
  };

  const TrendIcon = value.trend === 'up' ? TrendingUp : value.trend === 'down' ? TrendingDown : Minus;
  const trendColor = value.trend === 'up' ? 'text-emerald-500' : value.trend === 'down' ? 'text-red-500' : 'text-slate-400';

  const StatusIcon = value.status === 'green' ? CheckCircle : value.status === 'yellow' ? Clock : XCircle;
  const statusColor = value.status === 'green' ? 'text-emerald-500' : value.status === 'yellow' ? 'text-amber-500' : 'text-red-500';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="w-full px-2 py-1.5 rounded-lg hover:ring-2 hover:ring-sky-300 transition-all group"
    >
      <div className="flex items-center justify-center gap-2">
        <StatusIcon className={`h-3 w-3 ${statusColor} shrink-0`} />
        <span className="font-medium text-slate-900 text-sm">
          {formatValue(value.value)}
        </span>
        <TrendIcon className={`h-3 w-3 ${trendColor} shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
      </div>
      <p className="text-xs text-slate-400 mt-0.5">
        {new Date(value.timestamp).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
      </p>
    </motion.button>
  );
}