/**
 * AUTOMATION MAIN - FASE 4
 * IF-THEN rules, testing engine, templates library
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Plus,
  List,
  Package,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  Database,
} from 'lucide-react';
import { RuleBuilder } from './RuleBuilder';
import { RulesList } from './RulesList';
import { RuleTemplatesLibrary } from './RuleTemplatesLibrary';
import { TestingEngine } from './TestingEngine';
import type { Metric } from '@/types/metrics';
import { mockMetrics } from '@/lib/mockDataSprint0';
import { HelpTooltip, InfoBadge } from '@/components/shared/HelpTooltip';
import { EmptyState } from '@/components/shared/EmptyState';

interface AutomationMainProps {
  onCreateRule?: () => void;
  workspaceId?: string;
  workspaceName?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Trigger
  triggerType: 'data' | 'time' | 'event';
  triggerConfig: {
    metricId?: string;
    condition?: 'above' | 'below' | 'equals' | 'change' | 'outside_range';
    value?: number;
    threshold?: number;
    consecutiveDays?: number;
    schedule?: string; // cron expression
    event?: string;
  };
  
  // Actions
  actions: AutomationAction[];
  
  // Stats
  stats: {
    triggerCount: number;
    lastTriggered?: string;
    successRate: number;
    falsePositives: number;
  };
  
  // Testing
  tested?: boolean;
  testResults?: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
    confidence: number;
  };
}

export interface AutomationAction {
  id: string;
  type: 'notification' | 'athlete_action' | 'data_action' | 'smart_action';
  config: {
    // Notification
    channel?: 'email' | 'push' | 'slack' | 'sms';
    recipients?: string[];
    message?: string;
    
    // Athlete Action
    athleteAction?: 'flag' | 'message' | 'block_training' | 'reduce_load';
    
    // Data Action
    dataAction?: 'snapshot' | 'export' | 'webhook';
    webhookUrl?: string;
    
    // Smart Action
    smartAction?: 'auto_adjust_load' | 'suggest_recovery' | 'predict_injury';
  };
}

type ViewMode = 'rules' | 'templates' | 'testing';

// Mock rules
const mockRules: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Overtraining Alert',
    description: 'Alerta quando HRV < 60ms por 3 dias consecutivos',
    isActive: true,
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-28T14:30:00Z',
    triggerType: 'data',
    triggerConfig: {
      metricId: 'hrv',
      condition: 'below',
      value: 60,
      consecutiveDays: 3,
    },
    actions: [
      {
        id: 'action-1',
        type: 'notification',
        config: {
          channel: 'email',
          recipients: ['coach@team.com'],
          message: 'Atleta {athlete_name} com HRV baixo por 3 dias',
        },
      },
      {
        id: 'action-2',
        type: 'athlete_action',
        config: {
          athleteAction: 'flag',
        },
      },
    ],
    stats: {
      triggerCount: 24,
      lastTriggered: '2024-12-28T08:00:00Z',
      successRate: 87,
      falsePositives: 3,
    },
    tested: true,
    testResults: {
      truePositives: 21,
      falsePositives: 3,
      trueNegatives: 145,
      falseNegatives: 2,
      confidence: 87,
    },
  },
  {
    id: 'rule-2',
    name: 'Weekly Load Check',
    description: 'Verifica carga semanal todas as segundas às 9h',
    isActive: true,
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
    triggerType: 'time',
    triggerConfig: {
      schedule: '0 9 * * 1', // Every Monday at 9AM
    },
    actions: [
      {
        id: 'action-3',
        type: 'data_action',
        config: {
          dataAction: 'export',
        },
      },
      {
        id: 'action-4',
        type: 'notification',
        config: {
          channel: 'slack',
          message: 'Relatório semanal de carga disponível',
        },
      },
    ],
    stats: {
      triggerCount: 8,
      lastTriggered: '2024-12-23T09:00:00Z',
      successRate: 100,
      falsePositives: 0,
    },
  },
  {
    id: 'rule-3',
    name: 'Smart Load Adjustment',
    description: 'Ajusta carga automaticamente quando fadiga > 7',
    isActive: false,
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
    triggerType: 'data',
    triggerConfig: {
      metricId: 'fatigue',
      condition: 'above',
      value: 7,
    },
    actions: [
      {
        id: 'action-5',
        type: 'smart_action',
        config: {
          smartAction: 'auto_adjust_load',
        },
      },
      {
        id: 'action-6',
        type: 'notification',
        config: {
          channel: 'push',
          message: 'Carga ajustada automaticamente para {athlete_name}',
        },
      },
    ],
    stats: {
      triggerCount: 12,
      lastTriggered: '2024-12-15T15:00:00Z',
      successRate: 75,
      falsePositives: 3,
    },
    tested: true,
    testResults: {
      truePositives: 9,
      falsePositives: 3,
      trueNegatives: 78,
      falseNegatives: 4,
      confidence: 75,
    },
  },
];

export function AutomationMain({ onCreateRule, workspaceId, workspaceName }: AutomationMainProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('rules');
  const [rules, setRules] = useState<AutomationRule[]>(mockRules);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Stats
  const stats = useMemo(() => {
    const activeRules = rules.filter((r) => r.isActive).length;
    const totalTriggers = rules.reduce((sum, r) => sum + r.stats.triggerCount, 0);
    const avgSuccessRate = rules.reduce((sum, r) => sum + r.stats.successRate, 0) / rules.length;
    const totalFalsePositives = rules.reduce((sum, r) => sum + r.stats.falsePositives, 0);

    return {
      activeRules,
      totalRules: rules.length,
      totalTriggers,
      avgSuccessRate: avgSuccessRate.toFixed(0),
      totalFalsePositives,
    };
  }, [rules]);

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('❌ Deletar esta regra?\n\nEsta ação não pode ser revertida.')) {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    }
  };

  const handleSaveRule = (rule: AutomationRule) => {
    if (editingRule) {
      // Update existing
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? rule : r)));
    } else {
      // Create new
      setRules((prev) => [...prev, rule]);
    }
    setIsCreating(false);
    setEditingRule(null);
  };

  const viewModes = [
    { id: 'rules' as ViewMode, label: 'Active Rules', icon: List, count: stats.activeRules },
    { id: 'templates' as ViewMode, label: 'Templates', icon: Package, count: 12 },
    { id: 'testing' as ViewMode, label: 'Testing', icon: Activity, count: null },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Automation
              </h1>
              <HelpTooltip
                title="Automation - Regras IF-THEN"
                content={
                  <>
                    <p>Sistema de automação baseado em regras:</p>
                    <ul className="mt-2 space-y-2">
                      <li>
                        <strong className="text-emerald-300">Triggers ⚡</strong>
                        <p className="text-xs text-slate-300">Quando algo acontece (data, time, event)</p>
                      </li>
                      <li>
                        <strong className="text-sky-300">Conditions 🎯</strong>
                        <p className="text-xs text-slate-300">Se condição for verdadeira</p>
                      </li>
                      <li>
                        <strong className="text-purple-300">Actions 🚀</strong>
                        <p className="text-xs text-slate-300">Executa ação automaticamente</p>
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-amber-300 border-t border-slate-700 pt-2">
                      💡 Testa regras antes de ativar no Testing tab!
                    </p>
                  </>
                }
                position="bottom"
              />
              <HelpTooltip
                title="🎯 Tipos de Triggers"
                content={
                  <>
                    <p className="font-semibold mb-2">3 tipos de triggers disponíveis:</p>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-emerald-300">📊 Data Trigger</p>
                        <p className="text-xs text-slate-300">
                          Quando métrica atinge valor/condição (HRV &lt; 60, Fadiga &gt; 7)
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-sky-300">⏰ Time Trigger</p>
                        <p className="text-xs text-slate-300">
                          Agendado (cron): todas as segundas, diariamente, etc
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-300">🎉 Event Trigger</p>
                        <p className="text-xs text-slate-300">
                          Quando evento acontece (sessão completa, form enviado)
                        </p>
                      </div>
                    </div>
                  </>
                }
                position="bottom"
                size="md"
              />
              <HelpTooltip
                title="📊 Origem dos Dados"
                content={
                  <>
                    <p className="font-semibold mb-2">Regras podem usar dados de:</p>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-emerald-300">1. Métricas Live 🏃</p>
                        <p className="text-xs text-slate-300">
                          Triggers baseados em valores de métricas em tempo real
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-sky-300">2. Eventos 📅</p>
                        <p className="text-xs text-slate-300">
                          Triggers baseados em eventos (sessão completa, form enviado)
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-amber-300">3. Tempo ⏰</p>
                        <p className="text-xs text-slate-300">
                          Triggers agendados (cron)
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-300">4. Histórico 📈</p>
                        <p className="text-xs text-slate-300">
                          Análise de tendências e padrões históricos
                        </p>
                      </div>
                    </div>
                  </>
                }
                position="bottom"
                size="md"
              />
            </div>
            <p className="text-sm text-slate-600 mt-1">
              IF-THEN rules, testing engine e templates
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingRule(null);
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-amber-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Rule
          </motion.button>
        </div>

        {/* Workspace & Stats Info Bar */}
        {workspaceName && (
          <div className="px-4 py-2 mb-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <InfoBadge 
                label={`Workspace: ${workspaceName}`}
                color="slate"
                icon={<Database className="h-3 w-3" />}
              />
              <InfoBadge 
                label={`${stats.activeRules}/${stats.totalRules} ativas`}
                color={stats.activeRules > 0 ? 'green' : 'slate'}
                icon={<Zap className="h-3 w-3" />}
              />
              <InfoBadge 
                label={`${stats.avgSuccessRate}% success`}
                color={parseInt(stats.avgSuccessRate) >= 80 ? 'green' : 'amber'}
              />
              {stats.totalFalsePositives > 0 && (
                <InfoBadge 
                  label={`${stats.totalFalsePositives} false positives`}
                  color="amber"
                />
              )}
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex gap-2">
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
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-amber-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {mode.label}
                {mode.count !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {mode.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden bg-slate-50">
        {isCreating || editingRule ? (
          <RuleBuilder
            rule={editingRule}
            metrics={mockMetrics}
            onSave={handleSaveRule}
            onCancel={() => {
              setIsCreating(false);
              setEditingRule(null);
            }}
          />
        ) : viewMode === 'rules' ? (
          <RulesList
            rules={rules}
            onToggle={handleToggleRule}
            onEdit={(rule) => setEditingRule(rule)}
            onDelete={handleDeleteRule}
            onTest={(rule) => {
              setViewMode('testing');
            }}
          />
        ) : viewMode === 'templates' ? (
          <RuleTemplatesLibrary
            onUseTemplate={(template) => {
              setEditingRule(template);
              setIsCreating(true);
            }}
          />
        ) : (
          <TestingEngine rules={rules} metrics={mockMetrics} />
        )}
      </div>
    </div>
  );
}