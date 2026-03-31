/**
 * MetricLinkingPanel Component
 * 
 * Main panel for managing links between form fields and metrics.
 * Displays all form fields and allows creating/editing/removing metric links.
 * 
 * Features:
 * - List all form fields with link status
 * - Visual compatibility indicators
 * - Create new links (via SelectMetricModal)
 * - Create new metrics (via CreateMetricFromFieldModal)
 * - Remove existing links
 * - Real-time UI updates
 * 
 * Usage:
 * <MetricLinkingPanel
 *   formId={formId}
 *   fields={formFields}
 *   workspaceId={workspaceId}
 *   onLinkCreated={(link) => undefined}
 *   onLinkRemoved={(linkId) => undefined}
 * />
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Activity,
  Heart,
  Zap,
  Settings,
  Info,
  Loader2,
} from 'lucide-react';
import { SelectMetricModal, TransformConfig } from './SelectMetricModal';
import { CreateMetricFromFieldModal } from './CreateMetricFromFieldModal';
import { MetricLinkBadge } from './MetricLinkBadge';
import type {
  FormField,
  FormFieldMetricLink,
  FormFieldMetricLinkWithDetails,
  Metric,
  MetricType,
} from '@/types/metrics';
import { getCompatibleMetricTypes } from '@/types/metrics';
import { mockMetrics } from '@/lib/mockDataSprint0';

// ============================================================================
// TYPES
// ============================================================================

export interface MetricLinkingPanelProps {
  formId: string;
  fields: FormField[];
  workspaceId: string;
  onLinkCreated?: (link: FormFieldMetricLinkWithDetails) => void;
  onLinkRemoved?: (linkId: string) => void;
  onMetricCreated?: (metric: Metric) => void;
}

interface FieldWithLink extends FormField {
  link?: FormFieldMetricLinkWithDetails;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MetricLinkingPanel: React.FC<MetricLinkingPanelProps> = ({
  formId,
  fields,
  workspaceId,
  onLinkCreated,
  onLinkRemoved,
  onMetricCreated,
}) => {
  // State
  const [links, setLinks] = useState<FormFieldMetricLinkWithDetails[]>([]);
  // Removed unused 'loading' state - not needed for mock implementation
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [linkToRemove, setLinkToRemove] = useState<string | null>(null);

  // Fetch links on mount
  useEffect(() => {
    if (formId) {
      // No API call - just set empty links for now
      setLinks([]);
    }
  }, [formId]);

  // Merge fields with their links (MEMOIZED for performance)
  const fieldsWithLinks: FieldWithLink[] = useMemo(() => {
    return fields.map(field => {
      const link = links.find(l => l.fieldId === field.id);
      return { ...field, link };
    });
  }, [fields, links]);

  // Handle link creation from SelectMetricModal
  const handleLinkToMetric = (field: FormField) => {
    setSelectedField(field);
    setIsSelectModalOpen(true);
  };

  // Handle create metric from field
  const handleCreateMetric = (field: FormField) => {
    setSelectedField(field);
    setIsCreateModalOpen(true);
  };

  // Create link API call
  const createLink = async (metricId: string, config: TransformConfig) => {
    if (!selectedField) return;

    try {
      // MOCK DATA - Create link locally without API
      const metric = mockMetrics.find(m => m.id === metricId);
      
      if (!metric) {
        alert('Métrica não encontrada');
        return;
      }

      const newLink: FormFieldMetricLinkWithDetails = {
        id: `link-${Date.now()}`,
        workspaceId,
        formId,
        fieldId: selectedField.id,
        metricId,
        mappingType: config.mappingType,
        transformConfig: config.transformFunction ? {
          function: config.transformFunction,
          params: config.transformParams,
        } : null,
        autoCreateOnSubmit: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metric: metric,
        fieldName: selectedField.fieldLabel,
        fieldType: selectedField.fieldType,
      };

      // Add to local state
      setLinks(prev => [...prev, newLink]);
      
      // Callback
      if (onLinkCreated) {
        onLinkCreated(newLink);
      }
      
      // Close modal
      setIsSelectModalOpen(false);
      setSelectedField(null);
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Failed to create link');
    }
  };

  // Handle metric creation + auto-link
  const handleMetricCreated = async (metric: Metric) => {
    if (!selectedField) return;

    // Close modal first
    setIsCreateModalOpen(false);

    // Callback
    if (onMetricCreated) {
      onMetricCreated(metric);
    }

    // Auto-link the new metric
    try {
      const response = await fetch('/api/form-metric-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          formId,
          fieldId: selectedField.id,
          metricId: metric.id,
          mappingType: 'direct',
          autoCreateOnSubmit: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh links
        await fetchLinks();
        
        // Callback
        if (onLinkCreated && data.data) {
          onLinkCreated(data.data);
        }
      }
    } catch (error) {
      console.error('Error auto-linking metric:', error);
    }

    setSelectedField(null);
  };

  // Handle link removal
  const handleRemoveLink = async (linkId: string) => {
    setLinkToRemove(linkId);
  };

  // Confirm link removal
  const confirmRemoveLink = async () => {
    if (!linkToRemove) return;

    try {
      // MOCK DATA - Remove link locally without API
      setLinks(prev => prev.filter(l => l.id !== linkToRemove));
      
      // Callback
      if (onLinkRemoved) {
        onLinkRemoved(linkToRemove);
      }
      
      // Close confirmation
      setLinkToRemove(null);
    } catch (error) {
      console.error('Error removing link:', error);
      alert('Failed to remove link');
    }
  };

  // Get icon for metric category
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'performance':
        return <Zap className="h-4 w-4 text-amber-600" />;
      case 'wellness':
        return <Heart className="h-4 w-4 text-emerald-600" />;
      case 'load':
        return <Activity className="h-4 w-4 text-sky-600" />;
      case 'custom':
        return <Settings className="h-4 w-4 text-violet-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-slate-600" />;
    }
  };

  // Check if field type is compatible with metrics
  const isFieldLinkable = (field: FormField): boolean => {
    const compatibleTypes = getCompatibleMetricTypes(field.fieldType);
    return compatibleTypes.length > 0;
  };

  // Get already linked metric IDs (to exclude from SelectModal)
  const linkedMetricIds = links.map(l => l.metricId);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50/95 to-white/95">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="font-semibold text-slate-900 mb-1">
              📊 Metric Linking
            </h2>
            <p className="text-sm text-slate-600">
              Conecta form fields a métricas do Data OS para alimentar automaticamente dados dos atletas.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">
              {links.length}/{fields.length} fields linked
            </span>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-sky-50 border border-sky-200">
          <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-700">
            <p className="font-semibold mb-1">Como funciona:</p>
            <p>Quando um atleta preenche este formulário, os valores dos fields linkados serão automaticamente registados nas métricas correspondentes.</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {fields.length === 0 ? (
          // Empty state - no fields
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-2">Nenhum field no formulário</p>
            <p className="text-xs text-slate-500">
              Adiciona fields ao form builder primeiro
            </p>
          </div>
        ) : (
          // Field cards
          <div className="space-y-3">
            <AnimatePresence>
              {fieldsWithLinks.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FieldCard
                    field={field}
                    link={field.link}
                    isLinkable={isFieldLinkable(field)}
                    onLinkToMetric={() => handleLinkToMetric(field)}
                    onCreateMetric={() => handleCreateMetric(field)}
                    onRemoveLink={() => field.link && handleRemoveLink(field.link.id)}
                    getCategoryIcon={getCategoryIcon}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats summary */}
        {fields.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-500">Linked</span>
              </div>
              <p className="font-semibold text-slate-900">{links.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-slate-500">Not Linked</span>
              </div>
              <p className="font-semibold text-slate-900">{fields.length - links.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-medium text-slate-500">Total Fields</span>
              </div>
              <p className="font-semibold text-slate-900">{fields.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedField && (
        <>
          <SelectMetricModal
            isOpen={isSelectModalOpen}
            onClose={() => {
              setIsSelectModalOpen(false);
              setSelectedField(null);
            }}
            field={selectedField}
            workspaceId={workspaceId}
            existingLinkMetricIds={linkedMetricIds}
            onSelect={createLink}
          />

          <CreateMetricFromFieldModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setSelectedField(null);
            }}
            field={selectedField}
            workspaceId={workspaceId}
            onCreate={handleMetricCreated}
          />
        </>
      )}

      {/* Remove confirmation modal */}
      <AnimatePresence>
        {linkToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLinkToRemove(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Remover Link
                  </h3>
                  <p className="text-sm text-slate-600">
                    Tens a certeza que queres remover este link? Os dados já submetidos não serão afetados.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLinkToRemove(null)}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmRemoveLink}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:from-red-400 hover:to-red-500 transition-all"
                >
                  Remover Link
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// FIELD CARD COMPONENT
// ============================================================================

interface FieldCardProps {
  field: FieldWithLink;
  link?: FormFieldMetricLinkWithDetails;
  isLinkable: boolean;
  onLinkToMetric: () => void;
  onCreateMetric: () => void;
  onRemoveLink: () => void;
  getCategoryIcon: (category?: string) => React.ReactNode;
}

const FieldCard: React.FC<FieldCardProps> = ({
  field,
  link,
  isLinkable,
  onLinkToMetric,
  onCreateMetric,
  onRemoveLink,
  getCategoryIcon,
}) => {
  const isLinked = !!link;

  return (
    <div
      className={`
        p-4 rounded-xl border-2 transition-all
        ${isLinked
          ? 'border-emerald-200 bg-emerald-50/50'
          : isLinkable
          ? 'border-slate-200 bg-white'
          : 'border-slate-200 bg-slate-50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
            shrink-0 h-10 w-10 rounded-xl flex items-center justify-center
            ${isLinked
              ? 'bg-emerald-500'
              : isLinkable
              ? 'bg-gradient-to-br from-slate-100 to-white'
              : 'bg-slate-200'
            }
          `}
        >
          {isLinked ? (
            <CheckCircle className="h-5 w-5 text-white" />
          ) : (
            <span className="text-lg">{getFieldIcon(field.fieldType)}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Field info */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-slate-900 mb-0.5">
                {field.fieldLabel}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Type: {field.fieldType}</span>
                {field.required && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-medium">Required</span>
                  </>
                )}
              </div>
            </div>

            {/* Badge or warning */}
            {isLinked && link ? (
              <MetricLinkBadge
                metric={link.metric}
                isCompatible={true}
                className="shrink-0"
              />
            ) : !isLinkable ? (
              <span className="shrink-0 px-2 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold uppercase tracking-wide">
                Not Linkable
              </span>
            ) : null}
          </div>

          {/* Linked metric details */}
          {isLinked && link && (
            <div className="mb-3 p-3 rounded-lg bg-white border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(link.metric.category)}
                <span className="text-sm font-semibold text-slate-900">
                  {link.metric.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>
                  {link.metric.type === 'scale' && `Escala ${link.metric.scaleMin}-${link.metric.scaleMax}`}
                  {link.metric.type === 'numeric' && `Numérico${link.metric.unit ? ` (${link.metric.unit})` : ''}`}
                  {link.metric.type === 'boolean' && 'Sim/Não'}
                </span>
                {link.metric.category && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{link.metric.category}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Warning for non-linkable fields */}
          {!isLinked && !isLinkable && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Este tipo de field ({field.fieldType}) não pode ser linkado a métricas. Apenas number, select, checkbox, e date são suportados.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {isLinked && link ? (
              // Linked actions
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRemoveLink}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove Link
                </motion.button>
              </>
            ) : isLinkable ? (
              // Not linked actions
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLinkToMetric}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm hover:from-sky-400 hover:to-sky-500 transition-all"
                >
                  <Link2 className="h-3 w-3" />
                  Link to Metric
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCreateMetric}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border-2 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all"
                >
                  <Sparkles className="h-3 w-3" />
                  Create New Metric
                </motion.button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFieldIcon(fieldType: string): string {
  switch (fieldType) {
    case 'number':
      return '🔢';
    case 'select':
      return '📊';
    case 'checkbox':
      return '☑️';
    case 'text':
      return '📝';
    case 'textarea':
      return '📄';
    case 'date':
      return '📅';
    case 'time':
      return '⏰';
    case 'email':
      return '📧';
    case 'phone':
      return '📱';
    case 'file':
      return '📎';
    default:
      return '📋';
  }
}