import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import {
  WizardState,
  SmartSchedulingWizardProps,
  SessionDefaults,
  AvailabilityRules,
  Resources,
  CommitOptions
} from '@/types/scheduling';
import { WizardHeader } from './WizardHeader';
import { WizardFooter } from './WizardFooter';
import { WizardStep1SelectAthletes } from './WizardStep1SelectAthletes';
import { WizardStep2SessionDefaults } from './WizardStep2SessionDefaults';
import { WizardStep3Availability } from './WizardStep3Availability';
import { WizardStep4Resources } from './WizardStep4Resources';
import { WizardStep5Generate } from './WizardStep5Generate';
import { WizardStep6Review } from './WizardStep6Review';

export function SmartSchedulingWizard({
  onClose,
  onComplete,
  context
}: SmartSchedulingWizardProps) {
  // Estado principal
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    selectedAthletes: [],
    sessionDefaults: {
      type: 'session',
      duration: 60,
      buffer: 10,
      dateRange: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 dias
      },
      sessionsPerWeek: 2,
      maxPerDay: 8,
      priority: 'fifo'
    },
    availability: {
      global: [],
      perAthlete: new Map()
    },
    resources: {
      constraints: []
    },
    proposals: [],
    conflicts: [],
    coverage: 0,
    commitOptions: {
      notifyAthletes: true,
      createAsPending: false,
      attachTemplate: false
    },
    wizardId: context.draftId,
    isDirty: false,
    isGenerating: false
  });

  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastPlanRunId, setLastPlanRunId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Auto-save draft a cada 2 minutos
  useEffect(() => {
    if (!state.isDirty) return;

    const timer = setTimeout(() => {
      handleSaveDraft(true); // silent save
    }, 120000); // 2 minutos

    return () => clearTimeout(timer);
  }, [state, state.isDirty]);

  // Carregar draft se vindo de draft
  useEffect(() => {
    if (context.draftId) {
      loadDraft(context.draftId);
    }
  }, [context.draftId]);

  /**
   * Atualiza estado (marca como dirty)
   */
  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      isDirty: true
    }));
  };

  /**
   * Valida se pode avançar para próximo step
   */
  const canGoNext = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return state.selectedAthletes.length > 0;
      case 2:
        return (
          state.sessionDefaults.duration >= 15 &&
          state.sessionDefaults.dateRange.start < state.sessionDefaults.dateRange.end
        );
      case 3:
        return state.availability.global.some(r => r.type === 'can');
      case 4:
        return true; // recursos são opcionais
      case 5:
        return state.proposals.length > 0;
      case 6:
        return true; // sempre pode commitar
      default:
        return false;
    }
  };

  /**
   * Navegar para próximo step
   */
  const handleNext = () => {
    if (!canGoNext()) return;

    if (state.currentStep < 6) {
      updateState({ currentStep: (state.currentStep + 1) as any });
    }
  };

  /**
   * Navegar para step anterior
   */
  const handleBack = () => {
    if (state.currentStep > 1) {
      updateState({ currentStep: (state.currentStep - 1) as any });
    }
  };

  /**
   * Guardar draft
   */
  const handleSaveDraft = async (silent = false) => {
    setIsSavingDraft(true);

    try {
      const draftData = {
        athlete_ids: state.selectedAthletes.map(a => a.id),
        session_defaults: state.sessionDefaults,
        availability_rules: {
          global: state.availability.global,
          perAthlete: Object.fromEntries(state.availability.perAthlete)
        },
        resource_rules: state.resources,
        coverage_percentage: state.coverage,
        total_proposals: state.proposals.length,
        total_conflicts: state.conflicts.length,
        status: 'draft' as const
      };

      updateState({ isDirty: false });

      if (!silent) {
        // Toast success
        alert('Draft guardado!');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!silent) {
        alert('Erro ao guardar draft');
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  /**
   * Carregar draft existente
   */
  const loadDraft = async (draftId: string) => {
    try {
      // Mock: carregar do localStorage para demo
      const savedDraft = localStorage.getItem(`wizard_draft_${draftId}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setState(prev => ({
          ...prev,
          ...parsed,
          wizardId: draftId,
          isDirty: false
        }));
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  /**
   * Commit final (criar sessões)
   */
  const handleCommit = async () => {
    try {
      updateState({ isGenerating: true });

      // Mock success
      const mockPlanRunId = 'plan-run-' + Date.now();
      setLastPlanRunId(mockPlanRunId);
      setShowUndoToast(true);

      // Auto-hide undo toast após 30s
      setTimeout(() => {
        setShowUndoToast(false);
      }, 30000);

      onComplete({
        success: true,
        planRunId: mockPlanRunId,
        createdCount: state.proposals.filter(p => p.status !== 'skipped').length,
        skippedCount: state.proposals.filter(p => p.status === 'skipped').length
      });
    } catch (error) {
      console.error('Error committing:', error);
      updateState({ 
        error: 'Erro ao criar sessões. Tenta novamente.'
      });
    } finally {
      updateState({ isGenerating: false });
    }
  };

  /**
   * Undo (reverter plan run)
   */
  const handleUndo = async () => {
    if (!lastPlanRunId) return;

    try {
      setShowUndoToast(false);
      alert('Plano desfeito com sucesso!');
    } catch (error) {
      console.error('Error undoing:', error);
      alert('Erro ao desfazer');
    }
  };

  /**
   * Fechar wizard (com confirmação se dirty)
   */
  const handleClose = () => {
    if (state.isDirty) {
      const confirm = window.confirm(
        'Tens alterações não guardadas. Guardar antes de sair?'
      );
      
      if (confirm) {
        handleSaveDraft(false);
      }
    }
    
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Wizard Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Auto-Planner Wizard
                    </h2>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {state.currentStep === 1 && 'Seleciona atletas'}
                      {state.currentStep === 2 && 'Define sessões'}
                      {state.currentStep === 3 && 'Define disponibilidade'}
                      {state.currentStep === 4 && 'Recursos & regras'}
                      {state.currentStep === 5 && 'Gera horários'}
                      {state.currentStep === 6 && 'Revê & confirma'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save Draft Button */}
                  {state.isDirty && state.currentStep > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSaveDraft(false)}
                      disabled={isSavingDraft}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {isSavingDraft ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Guardar</span>
                    </motion.button>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <WizardHeader currentStep={state.currentStep} totalSteps={6} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Error Alert */}
            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Erro</p>
                  <p className="text-sm text-red-700 mt-0.5">{state.error}</p>
                </div>
                <button
                  onClick={() => updateState({ error: undefined })}
                  className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </motion.div>
            )}

            {/* Step Components */}
            <AnimatePresence mode="wait">
              {state.currentStep === 1 && (
                <WizardStep1SelectAthletes
                  key="step1"
                  state={state}
                  onChange={updateState}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {state.currentStep === 2 && (
                <WizardStep2SessionDefaults
                  key="step2"
                  state={state}
                  onChange={updateState}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {state.currentStep === 3 && (
                <WizardStep3Availability
                  key="step3"
                  state={state}
                  onChange={updateState}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {state.currentStep === 4 && (
                <WizardStep4Resources
                  key="step4"
                  state={state}
                  onChange={updateState}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {state.currentStep === 5 && (
                <WizardStep5Generate
                  key="step5"
                  state={state}
                  onChange={updateState}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {state.currentStep === 6 && (
                <WizardStep6Review
                  key="step6"
                  state={state}
                  onChange={updateState}
                  onNext={handleNext}
                  onBack={handleBack}
                  onCommit={handleCommit}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <WizardFooter
            currentStep={state.currentStep}
            totalSteps={6}
            canGoNext={canGoNext()}
            isLoading={state.isGenerating}
            onNext={handleNext}
            onBack={handleBack}
            onSaveDraft={() => handleSaveDraft(false)}
            showSaveDraft={state.isDirty && state.currentStep > 1 && state.currentStep < 6}
          />
        </motion.div>

        {/* Undo Toast */}
        {showUndoToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 max-w-md bg-emerald-900 text-white rounded-xl shadow-2xl p-4 z-[60]"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-800 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Plano criado com sucesso!</p>
                <p className="text-sm text-emerald-200 mt-0.5">
                  {state.proposals.filter(p => p.status !== 'skipped').length} sessões foram agendadas
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUndo}
                className="px-3 py-1.5 bg-white text-emerald-900 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
              >
                Desfazer
              </motion.button>
            </div>
            {/* Progress bar (30s) */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 30, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-emerald-400 rounded-b-xl"
            />
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
