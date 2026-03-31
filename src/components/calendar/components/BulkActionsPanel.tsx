/**
 * BULK ACTIONS PANEL
 * Multi-select and bulk operations for calendar events
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  Copy,
  Calendar,
  X,
  Download,
  Upload,
  Tag,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface BulkActionsPanelProps {
  selectedEvents: CalendarEvent[];
  onClearSelection: () => void;
  onBulkDelete: (eventIds: string[]) => Promise<void>;
  onBulkDuplicate: (eventIds: string[]) => Promise<void>;
  onBulkReschedule: (eventIds: string[]) => void;
  onBulkUpdateStatus: (eventIds: string[], status: string) => Promise<void>;
  onBulkAddTags: (eventIds: string[], tags: string[]) => Promise<void>;
  onBulkAssignAthletes: (eventIds: string[], athleteIds: string[]) => Promise<void>;
  onExport: (eventIds: string[]) => void;
}

export function BulkActionsPanel({
  selectedEvents,
  onClearSelection,
  onBulkDelete,
  onBulkDuplicate,
  onBulkReschedule,
  onBulkUpdateStatus,
  onBulkAddTags,
  onBulkAssignAthletes,
  onExport,
}: BulkActionsPanelProps) {
  const [showActions, setShowActions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedEvents.length;
  const selectedIds = selectedEvents.map(e => e.id);

  if (selectedCount === 0) return null;

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-sky-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedCount} evento{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-slate-600">
                  Escolha uma ação em massa para aplicar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowActions(!showActions)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
              >
                {showActions ? 'Ocultar' : 'Mostrar'} Ações
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClearSelection}
                disabled={isProcessing}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Actions Grid */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                  {/* Delete */}
                  <BulkActionButton
                    icon={Trash2}
                    label="Excluir"
                    color="red"
                    disabled={isProcessing}
                    onClick={() => handleAction(() => onBulkDelete(selectedIds))}
                  />

                  {/* Duplicate */}
                  <BulkActionButton
                    icon={Copy}
                    label="Duplicar"
                    color="sky"
                    disabled={isProcessing}
                    onClick={() => handleAction(() => onBulkDuplicate(selectedIds))}
                  />

                  {/* Reschedule */}
                  <BulkActionButton
                    icon={Calendar}
                    label="Reagendar"
                    color="violet"
                    disabled={isProcessing}
                    onClick={() => {
                      onBulkReschedule(selectedIds);
                      setShowActions(false);
                    }}
                  />

                  {/* Export */}
                  <BulkActionButton
                    icon={Download}
                    label="Exportar"
                    color="emerald"
                    disabled={isProcessing}
                    onClick={() => onExport(selectedIds)}
                  />

                  {/* Mark Complete */}
                  <BulkActionButton
                    icon={CheckCircle}
                    label="Completar"
                    color="emerald"
                    disabled={isProcessing}
                    onClick={() => handleAction(() => onBulkUpdateStatus(selectedIds, 'completed'))}
                  />

                  {/* Cancel */}
                  <BulkActionButton
                    icon={XCircle}
                    label="Cancelar"
                    color="amber"
                    disabled={isProcessing}
                    onClick={() => handleAction(() => onBulkUpdateStatus(selectedIds, 'cancelled'))}
                  />

                  {/* Add Tags */}
                  <BulkActionButton
                    icon={Tag}
                    label="Tags"
                    color="sky"
                    disabled={isProcessing}
                    onClick={() => {}}
                  />

                  {/* Assign Athletes */}
                  <BulkActionButton
                    icon={Users}
                    label="Atletas"
                    color="violet"
                    disabled={isProcessing}
                    onClick={() => {}}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Events Preview (collapsed) */}
          {!showActions && (
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                {selectedEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="px-3 py-1 bg-sky-100 text-sky-700 text-xs rounded-full font-medium"
                  >
                    {event.title}
                  </div>
                ))}
                {selectedCount > 5 && (
                  <div className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-full font-bold">
                    +{selectedCount - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="p-3 bg-sky-50 border-t border-sky-200">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full" />
                <span className="text-sm font-medium text-sky-700">
                  Processando {selectedCount} evento{selectedCount > 1 ? 's' : ''}...
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Bulk Action Button Component
 */
interface BulkActionButtonProps {
  icon: React.ElementType;
  label: string;
  color: 'red' | 'sky' | 'violet' | 'emerald' | 'amber';
  disabled?: boolean;
  onClick: () => void;
}

function BulkActionButton({
  icon: Icon,
  label,
  color,
  disabled = false,
  onClick,
}: BulkActionButtonProps) {
  const colors = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-600',
      hover: 'hover:bg-red-100',
      gradient: 'from-red-500 to-red-600',
    },
    sky: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-700',
      icon: 'text-sky-600',
      hover: 'hover:bg-sky-100',
      gradient: 'from-sky-500 to-sky-600',
    },
    violet: {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      text: 'text-violet-700',
      icon: 'text-violet-600',
      hover: 'hover:bg-violet-100',
      gradient: 'from-violet-500 to-violet-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: 'text-emerald-600',
      hover: 'hover:bg-emerald-100',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: 'text-amber-600',
      hover: 'hover:bg-amber-100',
      gradient: 'from-amber-500 to-amber-600',
    },
  };

  const config = colors[color];

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-xl text-center transition-all
        ${config.bg} border ${config.border}
        ${config.hover}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Icon className={`h-6 w-6 mx-auto mb-2 ${config.icon}`} />
      <span className={`text-xs font-semibold ${config.text}`}>
        {label}
      </span>
    </motion.button>
  );
}

/**
 * Bulk Selection Checkbox Component
 */
interface BulkSelectCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export function BulkSelectCheckbox({
  isSelected,
  onToggle,
  size = 'md',
}: BulkSelectCheckboxProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`
        ${sizeClasses[size]}
        rounded-lg border-2 transition-all
        flex items-center justify-center
        ${isSelected
          ? 'bg-sky-500 border-sky-500'
          : 'bg-white border-slate-300 hover:border-sky-300'
        }
      `}
    >
      {isSelected ? (
        <CheckSquare className={`${sizeClasses[size]} text-white`} strokeWidth={3} />
      ) : (
        <Square className={`${sizeClasses[size]} text-slate-400`} strokeWidth={2} />
      )}
    </motion.button>
  );
}

/**
 * Select All Header Component
 */
interface SelectAllHeaderProps {
  totalEvents: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SelectAllHeader({
  totalEvents,
  selectedCount,
  onSelectAll,
  onDeselectAll,
}: SelectAllHeaderProps) {
  const allSelected = selectedCount === totalEvents && totalEvents > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalEvents;

  const handleToggle = () => {
    if (allSelected || someSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className={`
          h-7 w-7 rounded-lg border-2 transition-all
          flex items-center justify-center
          ${allSelected || someSelected
            ? 'bg-sky-500 border-sky-500'
            : 'bg-white border-slate-300 hover:border-sky-300'
          }
        `}
      >
        {allSelected ? (
          <CheckSquare className="h-5 w-5 text-white" strokeWidth={3} />
        ) : someSelected ? (
          <div className="h-3 w-3 bg-white rounded-sm" />
        ) : (
          <Square className="h-5 w-5 text-slate-400" strokeWidth={2} />
        )}
      </motion.button>

      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">
          {selectedCount > 0 ? (
            <>
              {selectedCount} de {totalEvents} selecionado{selectedCount > 1 ? 's' : ''}
            </>
          ) : (
            <>Selecionar todos ({totalEvents})</>
          )}
        </p>
      </div>

      {selectedCount > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={onDeselectAll}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
        >
          Limpar seleção
        </motion.button>
      )}
    </div>
  );
}
