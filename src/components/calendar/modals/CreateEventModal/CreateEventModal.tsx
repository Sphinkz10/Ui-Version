/**
 * CREATE EVENT MODAL
 * Wizard de 5 passos para criar eventos
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useCalendar } from '../../core/CalendarProvider';
import { CreateEventFormData, EventTemplate } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/use-api';
import { findConflictingEvents } from '@/utils/calendarConflicts';
import { ConflictResolverModal, ConflictResolution } from '../ConflictResolverModal';
import { TemplatesLibrary } from '../../templates/TemplatesLibrary';
import { CreateTemplateModal } from '../../templates/CreateTemplateModal';
import { Step1ImportSource } from './Step1ImportSource';
import { Step2DateTime } from './Step2DateTime';
import { Step3Participants } from './Step3Participants';
import { Step4ConfirmationSettings } from './Step4ConfirmationSettings';
import { Step5Review } from './Step5Review';
import { supabase } from '@/lib/supabase/client';

interface CreateEventModalProps {
  workspaceId: string;
  initialDate?: Date;
  initialWorkoutId?: string;
}

const STEPS = [
  { id: 1, title: 'Origem', description: 'Manual ou Design Studio' },
  { id: 2, title: 'Data & Hora', description: 'Quando e onde' },
  { id: 3, title: 'Participantes', description: 'Quem participa' },
  { id: 4, title: 'Configurações de Confirmação', description: 'Configurar notificações' },
  { id: 5, title: 'Revisão', description: 'Confirmar detalhes' },
] as const;

export function CreateEventModal({
  workspaceId,
  initialDate,
  initialWorkoutId,
}: CreateEventModalProps) {
  const { isCreateModalOpen, setIsCreateModalOpen } = useCalendar();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [showTemplatesLibrary, setShowTemplatesLibrary] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<Partial<CreateEventFormData>>({
    source: 'manual',
    start_date: initialDate || new Date(),
    end_date: initialDate || new Date(),
    type: 'workout',
    athlete_ids: [],
    workout_id: initialWorkoutId,
  });

  // Fetch all events to check for conflicts
  const { data: eventsData } = useCalendarEvents(workspaceId, {});
  const events = eventsData?.events || [];

  // Find conflicting events
  const conflicts = useMemo(() => {
    if (!formData.start_date || !formData.end_date || !formData.athlete_ids?.length) {
      return [];
    }

    const targetEvent = {
      start_date: formData.start_date,
      end_date: formData.end_date,
      athlete_ids: formData.athlete_ids,
    };

    return findConflictingEvents(targetEvent, events);
  }, [formData.start_date, formData.end_date, formData.athlete_ids, events]);

  const updateFormData = (updates: Partial<CreateEventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.source !== undefined;
      case 2:
        return formData.title && formData.start_date && formData.end_date;
      case 3:
        // Participants are optional
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Check for conflicts before submitting
    if (conflicts.length > 0) {
      setShowConflictResolver(true);
      return;
    }

    await createEvent();
  };

  const handleConflictResolution = async (resolution: ConflictResolution) => {
    // Apply the resolution
    if (resolution.strategy === 'reschedule_new' && resolution.newStartDate) {
      updateFormData({
        start_date: resolution.newStartDate,
        end_date: resolution.newEndDate,
      });
      toast.info('Evento reagendado!');
      setShowConflictResolver(false);
      return; // Don't create yet, let user review
    }

    if (resolution.strategy === 'remove_athletes' && resolution.athletesToRemove) {
      const newAthletes = formData.athlete_ids?.filter(
        id => !resolution.athletesToRemove?.includes(id)
      ) || [];
      updateFormData({ athlete_ids: newAthletes });
      toast.info(`${resolution.athletesToRemove.length} atleta(s) removido(s)`);
    }

    if (resolution.strategy === 'cancel_old' && resolution.eventsToCancel) {
      // Mark events to cancel (would be handled in API call)
      toast.info('Eventos conflitantes serão cancelados');
    }

    if (resolution.strategy === 'smart_suggest' && resolution.smartSuggestion?.newStartDate) {
      updateFormData({
        start_date: resolution.smartSuggestion.newStartDate,
        end_date: resolution.smartSuggestion.newEndDate,
      });
      toast.success('Sugestão inteligente aplicada!');
      setShowConflictResolver(false);
      return; // Let user review
    }

    // If keep_both, just create
    if (resolution.strategy === 'keep_both') {
      toast.warning('Conflito ignorado - criando evento...');
    }

    // Create the event
    await createEvent();
    setShowConflictResolver(false);
  };

  const createEvent = async () => {
    setIsSubmitting(true);
    toast.info('A criar evento...');

    try {
      // Prepare API payload
      const payload = {
        workspaceId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: formData.start_date?.toISOString(),
        endDate: formData.end_date?.toISOString(),
        location: formData.location,
        color: formData.color,
        tags: formData.tags,
        athleteIds: formData.athlete_ids,
        workoutId: formData.workout_id,
        planId: formData.plan_id,
        classId: formData.class_id,
      };

      const insertPayload = {
        workspace_id: workspaceId,
        title: formData.title || 'Novo evento',
        description: formData.description || null,
        type: formData.type || 'workout',
        start_date: formData.start_date?.toISOString(),
        end_date: formData.end_date?.toISOString(),
        location: formData.location || null,
        status: 'scheduled',
        athlete_ids: formData.athlete_ids || [],
        workout_id: formData.workout_id || null,
        recurrence_pattern: formData.recurrence_pattern || null,
      };

      const { data: createdEvent, error } = await supabase
        .from('calendar_events')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Falha ao criar evento');
      }

      // Invalidate SWR cache to refresh events
      mutate((key) => typeof key === 'string' && key.startsWith('/api/calendar-events'));

      // Close modal
      setIsCreateModalOpen(false);

      // Reset form
      setCurrentStep(1);
      setFormData({
        source: 'manual',
        start_date: new Date(),
        end_date: new Date(),
        type: 'workout',
        athlete_ids: [],
      });

      // Success message
      toast.success(`Evento "${data.event.title}" criado com sucesso!`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao criar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsCreateModalOpen(false);
      setCurrentStep(1);
      setFormData({
        source: 'manual',
        start_date: new Date(),
        end_date: new Date(),
        type: 'workout',
        athlete_ids: [],
      });
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template: EventTemplate) => {
    // Calculate end date based on template duration
    const startDate = formData.start_date || new Date();
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + template.duration_minutes);

    // Apply template to form
    updateFormData({
      title: template.name,
      description: template.description,
      type: template.type,
      location: template.location,
      color: template.color,
      tags: template.tags,
      athlete_ids: template.default_athlete_ids || [],
      start_date: startDate,
      end_date: endDate,
    });

    setShowTemplatesLibrary(false);
    setCurrentStep(2); // Skip to date/time step
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const handleCreateNewTemplate = () => {
    setShowTemplatesLibrary(false);
    setShowCreateTemplateModal(true);
  };

  const handleSaveTemplate = (template: Partial<EventTemplate>) => {
    toast.success('Template guardado! (Mock - API em desenvolvimento)');
    setShowCreateTemplateModal(false);
  };

  // Render
  if (!isCreateModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Criar Evento</h2>
              <p className="text-sm text-slate-600 mt-1">
                Passo {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].description}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${currentStep > step.id
                        ? 'bg-emerald-500 text-white'
                        : currentStep === step.id
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <div
                        className={`text-sm font-semibold ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
                          }`}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors ${currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <Step1ImportSource
                  key="step1"
                  formData={formData}
                  updateFormData={updateFormData}
                  workspaceId={workspaceId}
                  onOpenTemplates={() => setShowTemplatesLibrary(true)}
                />
              )}
              {currentStep === 2 && (
                <Step2DateTime
                  key="step2"
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}
              {currentStep === 3 && (
                <Step3Participants
                  key="step3"
                  formData={formData}
                  updateFormData={updateFormData}
                  workspaceId={workspaceId}
                />
              )}
              {currentStep === 4 && (
                <Step4ConfirmationSettings
                  key="step4"
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}
              {currentStep === 5 && (
                <Step5Review
                  key="step5"
                  formData={formData}
                  workspaceId={workspaceId}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              {currentStep < STEPS.length ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl shadow-md hover:from-sky-400 hover:to-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Criar Evento
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conflict Resolver Modal */}
      <ConflictResolverModal
        isOpen={showConflictResolver}
        onClose={() => setShowConflictResolver(false)}
        targetEvent={formData as any}
        conflicts={conflicts}
        onResolve={handleConflictResolution}
        workspaceId={workspaceId}
      />

      {/* Templates Library Modal */}
      <TemplatesLibrary
        isOpen={showTemplatesLibrary}
        onClose={() => setShowTemplatesLibrary(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateNew={handleCreateNewTemplate}
        workspaceId={workspaceId}
      />

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        workspaceId={workspaceId}
        onSave={handleSaveTemplate}
      />
    </>
  );
}