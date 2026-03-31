/**
 * LIBRARY UNIFIED WITH MODALS - PARTE 3 INTEGRADA
 * Adiciona Delete Modals + History Panel + Archived Page + Export Real
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { LibraryUnified } from './LibraryUnified';
import { DeleteMetricModal } from '@/components/dataos/modals/DeleteMetricModal';
import { BulkDeleteModal } from '@/components/dataos/modals/BulkDeleteModal';
import { HardDeleteConfirmation } from '@/components/dataos/modals/HardDeleteConfirmation';
import { BlockedDeleteModal } from '@/components/dataos/modals/BlockedDeleteModal';
import { RestoreMetricModal } from '@/components/dataos/modals/RestoreMetricModal';
import { ArchivedMetricsPage } from '@/components/dataos/ArchivedMetricsPage';
import { MetricHistoryPanel } from '@/components/dataos/MetricHistoryPanel';
import { HistoryExportModal } from '@/components/dataos/modals/HistoryExportModal';
import { exportHistory, type ExportConfig, type HistoryEntry } from '@/lib/exportUtils';
import type { Metric } from '@/types/metrics';

interface LibraryUnifiedWithModalsProps {
  onCreateMetric: () => void;
  workspaceId?: string;
  workspaceName?: string;
}

export function LibraryUnifiedWithModals({
  onCreateMetric,
  workspaceId,
  workspaceName,
}: LibraryUnifiedWithModalsProps) {
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
  const [blockedDeleteModalOpen, setBlockedDeleteModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyExportModalOpen, setHistoryExportModalOpen] = useState(false);
  const [showArchivedPage, setShowArchivedPage] = useState(false);

  // Selected metrics
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>([]);

  // Temp state for hard delete confirmation
  const [pendingHardDelete, setPendingHardDelete] = useState<{
    metric: Metric;
    deleteData: boolean;
  } | null>(null);

  // Mock automations (TODO: fetch from API)
  const mockAutomations = [
    {
      id: 'auto-1',
      name: 'Alerta se < baseline',
      type: 'Alerta de valor',
    },
    {
      id: 'auto-2',
      name: 'Email semanal de progresso',
      type: 'Relatório automático',
    },
  ];

  // ============================================================================
  // HANDLERS - DELETE
  // ============================================================================

  const handleDeleteClick = (metric: Metric) => {
    setSelectedMetric(metric);
    
    // Check if metric has blocking automations
    const hasAutomations = mockAutomations.length > 0; // TODO: Check real automations
    
    if (hasAutomations) {
      setBlockedDeleteModalOpen(true);
    } else {
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = (deleteType: 'soft' | 'hard', deleteData: boolean) => {
    if (!selectedMetric) return;

    if (deleteType === 'hard') {
      // Store pending hard delete and show double confirmation
      setPendingHardDelete({ metric: selectedMetric, deleteData });
      setDeleteModalOpen(false);
      setHardDeleteConfirmOpen(true);
    } else {
      // Soft delete - immediate
      performSoftDelete(selectedMetric);
    }
  };

  const handleHardDeleteConfirm = () => {
    if (!pendingHardDelete) return;

    performHardDelete(pendingHardDelete.metric, pendingHardDelete.deleteData);
    setPendingHardDelete(null);
  };

  const performSoftDelete = (metric: Metric) => {
    toast.success(`✅ Métrica "${metric.name}" arquivada com sucesso!`, {
      description: 'Pode ser restaurada a qualquer momento em "Arquivadas"',
    });
    setSelectedMetric(null);
  };

  const performHardDelete = (metric: Metric, deleteData: boolean) => {
    toast.success(`🗑️ Métrica "${metric.name}" apagada permanentemente!`, {
      description: deleteData ? 'Dados históricos também removidos' : 'Dados históricos mantidos',
    });
    setSelectedMetric(null);
  };

  // ============================================================================
  // HANDLERS - BULK DELETE
  // ============================================================================

  const handleBulkDeleteClick = (metrics: Metric[]) => {
    setSelectedMetrics(metrics);
    setBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = (deleteType: 'soft' | 'hard') => {
    toast.success(
      `✅ ${selectedMetrics.length} métricas ${
        deleteType === 'soft' ? 'arquivadas' : 'apagadas'
      } com sucesso!`
    );
    setSelectedMetrics([]);
  };

  // ============================================================================
  // HANDLERS - RESTORE
  // ============================================================================

  const handleRestoreClick = (metricId: string) => {
    // TODO: Fetch metric details
    const metric = {
      name: 'Força Máxima Squat',
      historicalEntries: 47,
      affectedAthletes: 15,
      automations: 2,
    };
    setRestoreModalOpen(true);
  };

  const handleRestoreConfirm = () => {
    // TODO: API call
    toast.success('✅ Métrica restaurada com sucesso!', {
      description: 'Já aparece em "Minhas Métricas"',
    });
  };

  // ============================================================================
  // HANDLERS - HISTORY
  // ============================================================================

  const handleViewHistory = (metric: Metric) => {
    setSelectedMetric(metric);
    setHistoryPanelOpen(true);
  };

  const handleExportHistory = (format: string) => {
    setHistoryExportModalOpen(true);
  };

  const handleExportConfirm = (config: ExportConfig) => {
    if (!selectedMetric) return;
    
    // Mock data - TODO: fetch real history from API
    const mockHistoryData: HistoryEntry[] = [
      {
        id: '1',
        date: 'Hoje',
        time: '14:23',
        athleteName: 'João Silva',
        value: 160,
        unit: selectedMetric.unit || 'kg',
        zone: 'green',
        change: 5,
        changeLabel: '+5kg',
        note: 'Felt strong today',
        noteAuthor: 'Coach Pedro',
        entryBy: 'Coach Pedro',
      },
      {
        id: '2',
        date: 'Ontem',
        time: '10:15',
        athleteName: 'Maria Santos',
        value: 100,
        unit: selectedMetric.unit || 'kg',
        zone: 'yellow',
        change: 5,
        changeLabel: '+5kg',
        note: 'Recovering from injury',
        entryBy: 'Physio Ana',
      },
      {
        id: '3',
        date: '14 Jan',
        time: '16:45',
        athleteName: 'Pedro Costa',
        value: 175,
        unit: selectedMetric.unit || 'kg',
        zone: 'green',
        change: 5,
        changeLabel: '+5kg',
        note: 'Personal record!',
        noteAuthor: 'Coach Pedro',
        entryBy: 'Coach Pedro',
      },
    ];

    // Call export function with real implementation
    exportHistory(mockHistoryData, config, selectedMetric.name);
    
    toast.success(`📥 Histórico exportado em ${config.format.toUpperCase()}!`, {
      description: `Ficheiro "${selectedMetric.name}_historico.${config.format}" descarregado`,
    });
  };

  // ============================================================================
  // HANDLERS - ARCHIVED PAGE
  // ============================================================================

  const handleDeletePermanently = (metricId: string) => {
    // Show hard delete confirmation
    const metric = {
      id: metricId,
      name: 'Força Máxima Squat',
      // ... other properties
    } as Metric;
    setSelectedMetric(metric);
    setPendingHardDelete({ metric, deleteData: true });
    setHardDeleteConfirmOpen(true);
  };

  const handleManageAutomations = () => {
    // TODO: Navigate to automations page
    toast.info('🔄 Navegar para página de automações...');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // If showing archived page, render it instead of main library
  if (showArchivedPage) {
    return (
      <>
        <ArchivedMetricsPage
          onBack={() => setShowArchivedPage(false)}
          onRestore={handleRestoreClick}
          onDeletePermanently={handleDeletePermanently}
        />

        {/* Restore Modal */}
        {restoreModalOpen && (
          <RestoreMetricModal
            isOpen={restoreModalOpen}
            onClose={() => setRestoreModalOpen(false)}
            metric={{
              name: 'Força Máxima Squat',
              historicalEntries: 47,
              affectedAthletes: 15,
              automations: 2,
            }}
            onConfirm={handleRestoreConfirm}
          />
        )}

        {/* Hard Delete Confirmation (from archived page) */}
        {hardDeleteConfirmOpen && selectedMetric && pendingHardDelete && (
          <HardDeleteConfirmation
            isOpen={hardDeleteConfirmOpen}
            onClose={() => {
              setHardDeleteConfirmOpen(false);
              setPendingHardDelete(null);
            }}
            metric={{
              name: selectedMetric.name,
              historicalEntries: 47,
              affectedAthletes: 15,
              automations: 2,
            }}
            onConfirm={handleHardDeleteConfirm}
          />
        )}
      </>
    );
  }

  // Main library with all modals
  return (
    <>
      <LibraryUnified
        onCreateMetric={onCreateMetric}
        onEdit={(metric) => {
          toast.info('🔄 Edit modal coming soon...');
        }}
        onDelete={handleDeleteClick}
        onViewHistory={handleViewHistory}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
      />
      {/* Delete Modal */}
      {deleteModalOpen && selectedMetric && (
        <DeleteMetricModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedMetric(null);
          }}
          metric={{
            id: selectedMetric.id,
            name: selectedMetric.name,
            historicalEntries: 47,
            affectedAthletes: 15,
            automations: 2,
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <BulkDeleteModal
          isOpen={bulkDeleteModalOpen}
          onClose={() => {
            setBulkDeleteModalOpen(false);
            setSelectedMetrics([]);
          }}
          selectedMetrics={selectedMetrics.map((m) => ({
            id: m.id,
            name: m.name,
            historicalEntries: 47,
            affectedAthletes: 15,
            automations: 2,
          }))}
          onConfirm={handleBulkDeleteConfirm}
        />
      )}
      {/* Hard Delete Confirmation */}
      {hardDeleteConfirmOpen && selectedMetric && pendingHardDelete && (
        <HardDeleteConfirmation
          isOpen={hardDeleteConfirmOpen}
          onClose={() => {
            setHardDeleteConfirmOpen(false);
            setPendingHardDelete(null);
          }}
          metric={{
            name: selectedMetric.name,
            historicalEntries: 47,
            affectedAthletes: 15,
            automations: 2,
          }}
          onConfirm={handleHardDeleteConfirm}
        />
      )}
      {/* Blocked Delete Modal */}
      {blockedDeleteModalOpen && selectedMetric && (
        <BlockedDeleteModal
          isOpen={blockedDeleteModalOpen}
          onClose={() => {
            setBlockedDeleteModalOpen(false);
            setSelectedMetric(null);
          }}
          metric={{
            name: selectedMetric.name,
          }}
          automations={mockAutomations}
          onManageAutomations={handleManageAutomations}
        />
      )}
      {/* History Panel */}
      {historyPanelOpen && selectedMetric && (
        <MetricHistoryPanel
          isOpen={historyPanelOpen}
          onClose={() => {
            setHistoryPanelOpen(false);
            setSelectedMetric(null);
          }}
          metric={{
            name: selectedMetric.name,
            unit: selectedMetric.unit || '',
          }}
          onExport={handleExportHistory}
        />
      )}
      {/* History Export Modal */}
      {historyExportModalOpen && selectedMetric && (
        <HistoryExportModal
          isOpen={historyExportModalOpen}
          onClose={() => setHistoryExportModalOpen(false)}
          metricName={selectedMetric.name}
          onExport={handleExportConfirm}
        />
      )}
    </>
  );
}