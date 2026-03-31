/**
 * EVENT DETAILS MODAL
 * View, edit, and delete events
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Edit, Trash2, Copy, Save, XCircle } from 'lucide-react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useCalendar } from '../../core/CalendarProvider';
import { CalendarEvent } from '@/types/calendar';
import { EventInfo } from './EventInfo';
import { EditEventForm } from './EditEventForm';
import { DeleteConfirmation } from './DeleteConfirmation';
import { RecurrenceScopeDialog, RecurrenceScope, RecurrenceAction } from '../RecurrenceScopeDialog';

interface EventDetailsModalProps {
  workspaceId: string;
}

type ModalMode = 'view' | 'edit' | 'delete';

export function EventDetailsModal({
  workspaceId,
}: EventDetailsModalProps) {
  const { isDetailsModalOpen, setIsDetailsModalOpen, selectedEvent, setSelectedEvent, setIsCreateModalOpen } = useCalendar();
  const [mode, setMode] = useState<ModalMode>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedData, setEditedData] = useState<Partial<CalendarEvent>>({});
  
  // Recurrence scope dialog state
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<RecurrenceAction | null>(null);
  
  if (!selectedEvent) return null;
  
  // Check if event is recurring
  const isRecurring = !!(selectedEvent.recurrence_rule || selectedEvent.recurrence_parent_id);
  const instanceNumber = selectedEvent.metadata?.instance_number;
  const totalInstances = selectedEvent.metadata?.total_instances;
  
  const handleEdit = () => {
    // Check if recurring
    if (isRecurring) {
      setPendingAction('edit');
      setShowRecurrenceDialog(true);
    } else {
      startEdit();
    }
  };
  
  const startEdit = () => {
    setMode('edit');
    setEditedData({
      title: selectedEvent.title,
      description: selectedEvent.description,
      type: selectedEvent.type,
      start_date: selectedEvent.start_date,
      end_date: selectedEvent.end_date,
      location: selectedEvent.location,
      color: selectedEvent.color,
      tags: selectedEvent.tags,
      athlete_ids: selectedEvent.athlete_ids,
    });
  };
  
  const handleCancelEdit = () => {
    setMode('view');
    setEditedData({});
  };
  
  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/calendar-events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          ...editedData,
          startDate: editedData.start_date,
          endDate: editedData.end_date,
          athleteIds: editedData.athlete_ids,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event');
      }

      // Invalidate SWR cache
      mutate((key) => typeof key === 'string' && key.startsWith('/api/calendar-events'));

      // Back to view mode
      setMode('view');
      setEditedData({});

      // Success message
      toast.success(`Evento \"${data.event.title}\" atualizado!`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar evento');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveEditSeries = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/calendar-events/series', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          ...editedData,
          startDate: editedData.start_date,
          endDate: editedData.end_date,
          athleteIds: editedData.athlete_ids,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update series');
      }

      // Invalidate SWR cache
      mutate((key) => typeof key === 'string' && key.startsWith('/api/calendar-events'));

      // Back to view mode
      setMode('view');
      setEditedData({});

      // Success message
      toast.success(`Série atualizada! ${data.eventsUpdated} eventos modificados`);
    } catch (error) {
      console.error('Error updating series:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar série');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = () => {
    // Check if recurring
    if (isRecurring) {
      setPendingAction('delete');
      setShowRecurrenceDialog(true);
    } else {
      setMode('delete');
    }
  };
  
  const handleConfirmDelete = async (permanent: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/calendar-events?eventId=${selectedEvent.id}&cancel=${!permanent}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      // Invalidate SWR cache
      mutate((key) => typeof key === 'string' && key.startsWith('/api/calendar-events'));

      // Close modal
      setIsDetailsModalOpen(false);

      // Success message
      toast.success(permanent ? 'Evento deletado permanentemente' : 'Evento cancelado');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao eliminar evento');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteSeries = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/calendar-events/series?eventId=${selectedEvent.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete series');
      }

      // Invalidate SWR cache
      mutate((key) => typeof key === 'string' && key.startsWith('/api/calendar-events'));

      // Close modal
      setIsDetailsModalOpen(false);
      setMode('view');

      // Success message
      toast.success(`Série eliminada! ${data.eventsDeleted} eventos removidos`);
    } catch (error) {
      console.error('Error deleting series:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao eliminar série');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRecurrenceScopeConfirm = (scope: RecurrenceScope) => {
    setShowRecurrenceDialog(false);
    
    if (pendingAction === 'edit') {
      if (scope === 'single') {
        startEdit();
      } else {
        // Edit all - will use handleSaveEditSeries when saving
        startEdit();
      }
    } else if (pendingAction === 'delete') {
      if (scope === 'single') {
        setMode('delete');
      } else {
        // Delete all immediately
        handleDeleteSeries();
      }
    }
    
    setPendingAction(null);
  };
  
  const handleCancelDelete = () => {
    setMode('view');
  };
  
  const handleDuplicate = () => {
    if (!selectedEvent) return;
    
    // Close current modal
    handleClose();
    
    // Open CreateEventModal with pre-filled data
    // Note: We need to pass this data through context or a different mechanism
    // For now, we'll trigger a custom event that CreateEventModal listens to
    const duplicateData = {
      title: `${selectedEvent.title} (Cópia)`,
      description: selectedEvent.description,
      type: selectedEvent.type,
      start_time: selectedEvent.start_time,
      end_time: selectedEvent.end_time,
      location: selectedEvent.location,
      is_public: selectedEvent.is_public,
      require_confirmation: selectedEvent.require_confirmation,
      max_participants: selectedEvent.max_participants,
      tags: selectedEvent.tags,
      metadata: selectedEvent.metadata,
    };
    
    // Dispatch custom event with duplicate data
    window.dispatchEvent(new CustomEvent('duplicate-event', { 
      detail: duplicateData 
    }));
    
    // Open create modal
    setTimeout(() => {
      setIsCreateModalOpen(true);
    }, 100);
    
    toast.success('Evento preparado para duplicação!');
  };
  
  const handleClose = () => {
    if (!isSubmitting) {
      setMode('view');
      setEditedData({});
      setIsDetailsModalOpen(false);
    }
  };
  
  if (!isDetailsModalOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex-1">
            {mode === 'view' && (
              <h2 className="text-2xl font-bold text-slate-900">
                Detalhes do Evento
              </h2>
            )}
            {mode === 'edit' && (
              <h2 className="text-2xl font-bold text-slate-900">
                Editar Evento
              </h2>
            )}
            {mode === 'delete' && (
              <h2 className="text-2xl font-bold text-red-900">
                Eliminar Evento
              </h2>
            )}
          </div>
          
          {/* Actions */}
          {mode === 'view' && (
            <div className="flex items-center gap-2 mr-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDuplicate}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                title="Duplicar"
              >
                <Copy className="h-5 w-5 text-slate-600" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="p-2 rounded-xl hover:bg-sky-100 transition-colors"
                title="Editar"
              >
                <Edit className="h-5 w-5 text-sky-600" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="p-2 rounded-xl hover:bg-red-100 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </motion.button>
            </div>
          )}
          
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {mode === 'view' && (
              <EventInfo
                key="view"
                event={selectedEvent}
                workspaceId={workspaceId}
              />
            )}
            
            {mode === 'edit' && (
              <EditEventForm
                key="edit"
                event={selectedEvent}
                editedData={editedData}
                setEditedData={setEditedData}
                workspaceId={workspaceId}
              />
            )}
            
            {mode === 'delete' && (
              <DeleteConfirmation
                key="delete"
                event={selectedEvent}
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          {mode === 'view' && (
            <>
              <div className="text-xs text-slate-500">
                Criado em {new Date(selectedEvent.created_at).toLocaleDateString('pt-PT')}
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </>
          )}
          
          {mode === 'edit' && (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Alterações
                  </>
                )}
              </motion.button>
              
              {isRecurring && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEditSeries}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Série
                    </>
                  )}
                </motion.button>
              )}
            </>
          )}
          
          {mode === 'delete' && (
            <>
              <button
                onClick={handleCancelDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConfirmDelete(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar Evento
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConfirmDelete(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Eliminar Permanentemente
                    </>
                  )}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
      
      {/* Recurrence Scope Dialog */}
      {pendingAction && (
        <RecurrenceScopeDialog
          isOpen={showRecurrenceDialog}
          onClose={() => {
            setShowRecurrenceDialog(false);
            setPendingAction(null);
          }}
          onConfirm={handleRecurrenceScopeConfirm}
          action={pendingAction}
          eventTitle={selectedEvent.title}
          instanceNumber={instanceNumber}
          totalInstances={totalInstances}
        />
      )}
    </div>
  );
}