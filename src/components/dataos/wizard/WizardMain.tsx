/**
 * WIZARD MAIN - FASE 4 DIA 11 + TODAS AS FEATURES AVANÇADAS ✨
 * Create Metric Wizard - 5 Steps + Quick Mode + Advanced Features
 * 
 * FEATURES CORE:
 * - Quick Mode: 3 campos essenciais (Nome, Tipo, Unit)
 * - Full Wizard: 5 steps completos
 * - Progress bar responsivo
 * - Navigation: Anterior/Próximo/Criar
 * - Validation per step
 * - Live preview (desktop sidebar)
 * 
 * ✨ FEATURES AVANÇADAS:
 * - Auto-save & Rascunhos (10s)
 * - Export/Import JSON
 * - Keyboard shortcuts (←→ Enter Esc Ctrl+S Ctrl+E)
 * - Swipe gestures (mobile)
 * - Draft recovery prompt
 * - Post-creation modal (3 actions)
 * - Real-time validation visual
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Zap,
  List,
  Sparkles,
  Download,
  Upload,
} from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { ResponsiveModal } from '@/components/shared/ResponsiveModal';
import { WizardProgress } from './WizardProgress';
import { LivePreview } from './LivePreview';
import {
  Step1BasicInfo,
  Step2TypeValidation,
  Step3ZonesBaseline,
  Step4Categorization,
  Step5Review,
} from './steps';
import type { Metric, MetricType, MetricCategory } from '@/types/metrics';

// ✨ NEW: Advanced Features
import { useWizardAutoSave } from '@/hooks/useWizardAutoSave';
import { useWizardKeyboardShortcuts } from '@/hooks/useWizardKeyboardShortcuts';
import {
  exportWizardToJSON,
  importWizardFromJSON,
  mergeWizardData,
  generateFilename,
} from '@/lib/wizardExportImport';
import {
  DraftRecoveryPrompt,
  AutoSaveIndicator,
  ExportImportButtons,
  ExportModal,
  ImportModal,
  PostCreationModal,
} from './WizardAdvancedFeatures';

type WizardMode = 'quick' | 'full';
type WizardStep = 1 | 2 | 3 | 4 | 5;

interface WizardMainProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: WizardMode;
  onCreate?: (metric: Partial<Metric>) => Promise<void>;
  workspaceId?: string;
}

interface WizardData {
  // Step 1: Basic Info
  name: string;
  description: string;
  type: MetricType | '';
  
  // Step 2: Type Validation
  unit: string;
  scaleMin?: number;
  scaleMax?: number;
  
  // Step 3: Zones & Baseline
  zones: Array<{
    id: string;
    name: string;
    color: string;
    min: number;
    max: number;
  }>;
  baselineMethod: 'rolling-average' | 'manual' | 'percentile';
  baselinePeriodDays: number;
  baselineManualValue?: number;
  
  // Step 4: Categorization
  category: MetricCategory | '';
  tags: string[];
  updateFrequency: 'daily' | 'per-session' | 'weekly' | 'on-demand';
  
  // Step 5: Review (computed)
}

const initialData: WizardData = {
  name: '',
  description: '',
  type: '',
  unit: '',
  zones: [],
  baselineMethod: 'rolling-average',
  baselinePeriodDays: 28,
  category: '',
  tags: [],
  updateFrequency: 'daily',
};

export function WizardMain({
  isOpen,
  onClose,
  initialMode = 'quick',
  onCreate,
  workspaceId,
}: WizardMainProps) {
  const { isMobile, isTablet } = useResponsive();
  
  const [mode, setMode] = useState<WizardMode>(initialMode);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  // Wizard data state
  const [data, setData] = useState<WizardData>(initialData);

  // ✨ NEW: Advanced Features State
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [exportJson, setExportJson] = useState('');

  // ✨ NEW: Auto-save hook
  const autoSave = useWizardAutoSave(data, currentStep, mode, {
    workspaceId: workspaceId || 'default',
    enabled: isOpen && !createSuccess,
    autoSaveInterval: 10000, // 10s
  });

  // ✨ NEW: Check for draft on mount
  useEffect(() => {
    if (isOpen) {
      const draft = autoSave.loadDraft();
      if (draft && !showDraftRecovery) {
        setShowDraftRecovery(true);
      }
    }
  }, [isOpen]);

  // ✨ NEW: Keyboard shortcuts
  useWizardKeyboardShortcuts({
    enabled: isOpen && !showExport && !showImport && !showDraftRecovery && !showPostCreation,
    currentStep,
    totalSteps: mode === 'quick' ? 1 : 5,
    hasUnsavedChanges: autoSave.hasUnsavedChanges,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onClose: handleClose,
    onSave: autoSave.saveNow,
    onExport: handleExport,
    onSubmit: mode === 'quick' ? handleCreateQuick : handleCreateFull,
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMode(initialMode);
        setCurrentStep(1);
        setCreating(false);
        setCreateSuccess(false);
        setData(initialData);
        setShowDraftRecovery(false);
        setShowExport(false);
        setShowImport(false);
        setShowPostCreation(false);
      }, 300);
    }
  }, [isOpen, initialMode]);

  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const validateQuickMode = (): string | null => {
    if (!data.name.trim()) return 'Nome é obrigatório';
    if (!data.type) return 'Tipo é obrigatório';
    return null;
  };

  const validateStep = (step: WizardStep): string | null => {
    switch (step) {
      case 1:
        if (!data.name.trim()) return 'Nome é obrigatório';
        if (!data.type) return 'Tipo é obrigatório';
        return null;
      
      case 2:
        if (data.type === 'scale') {
          if (!data.unit) return 'Unidade é obrigatória para escalas';
          if (data.scaleMin === undefined || data.scaleMax === undefined) {
            return 'Define min/max para escalas';
          }
          if (data.scaleMin >= data.scaleMax) {
            return 'Mínimo deve ser menor que máximo';
          }
        }
        return null;
      
      case 3:
        // Zones and baseline are optional
        return null;
      
      case 4:
        if (!data.category) return 'Categoria é obrigatória';
        return null;
      
      case 5:
        // Review step - no validation needed
        return null;
      
      default:
        return null;
    }
  };

  const canProceed = (step: WizardStep): boolean => {
    return validateStep(step) === null;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleClose() {
    if (autoSave.hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Tens alterações não guardadas. Queres mesmo sair? O rascunho será guardado.'
      );
      if (!confirmed) return;
    }
    onClose();
  }
  
  function handleNext() {
    const error = validateStep(currentStep);
    if (error) {
      alert(error);
      return;
    }
    
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  }

  function handlePrevious() {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  }

  async function handleCreateQuick() {
    const error = validateQuickMode();
    if (error) {
      alert(error);
      return;
    }
    
    await handleCreate();
  }

  async function handleCreateFull() {
    const error = validateStep(5);
    if (error) {
      alert(error);
      return;
    }
    
    await handleCreate();
  }

  async function handleCreate() {
    setCreating(true);
    
    try {
      const metric: Partial<Metric> = {
        name: data.name,
        description: data.description || undefined,
        type: data.type as MetricType,
        category: data.category as MetricCategory || 'custom',
        unit: data.unit || undefined,
        updateFrequency: data.updateFrequency,
        tags: data.tags,
        scaleMin: data.scaleMin,
        scaleMax: data.scaleMax,
        zones: data.zones.length > 0 ? data.zones : undefined,
        baselineMethod: data.baselineMethod,
        baselinePeriodDays: data.baselinePeriodDays,
        baselineManualValue: data.baselineManualValue,
        aggregationMethod: 'latest',
        workspaceId: workspaceId || 'default',
        isActive: true,
      };
      
      await onCreate?.(metric);
      
      // ✨ Clear draft on success
      autoSave.clearDraft();
      
      setCreateSuccess(true);
      
      // ✨ Show post-creation modal instead of auto-close
      setTimeout(() => {
        setShowPostCreation(true);
      }, 500);
      
    } catch (error) {
      console.error('Error creating metric:', error);
      alert('Erro ao criar métrica. Tenta novamente.');
    } finally {
      setCreating(false);
    }
  }

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  // ✨ NEW: Export handler
  function handleExport() {
    const json = exportWizardToJSON(data);
    setExportJson(json);
    setShowExport(true);
  }

  // ✨ NEW: Import handler
  function handleImport() {
    setShowImport(true);
  }

  // ✨ NEW: Import data handler
  function handleImportData(importedData: any) {
    const merged = mergeWizardData(data, importedData);
    setData(merged);
  }

  // ✨ NEW: Recover draft handler
  function handleRecoverDraft() {
    const draft = autoSave.loadDraft();
    if (draft) {
      setData(draft.data);
      setCurrentStep(draft.step);
      setMode(draft.mode);
    }
    setShowDraftRecovery(false);
  }

  // ✨ NEW: Discard draft handler
  function handleDiscardDraft() {
    autoSave.clearDraft();
    setShowDraftRecovery(false);
  }

  // ============================================================================
  // SWIPE GESTURES (MOBILE)
  // ============================================================================

  function handleDragEnd(e: any, { offset, velocity }: any) {
    const swipeThreshold = 50;
    const swipeVelocity = 0.2;

    if (
      offset.x < -swipeThreshold ||
      velocity.x < -swipeVelocity
    ) {
      // Swipe left → Next
      if (currentStep < 5 && canProceed(currentStep)) {
        handleNext();
      }
    } else if (
      offset.x > swipeThreshold ||
      velocity.x > swipeVelocity
    ) {
      // Swipe right → Previous
      if (currentStep > 1) {
        handlePrevious();
      }
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  
  const totalSteps = mode === 'quick' ? 1 : 5;
  const progress = mode === 'quick' ? 100 : (currentStep / totalSteps) * 100;

  // Desktop layout: show LivePreview sidebar
  const showPreview = !isMobile && !isTablet && mode === 'full';

  return (
    <>
      <ResponsiveModal
        isOpen={isOpen}
        onClose={handleClose}
        title={mode === 'quick' ? 'Criar Métrica Rápida' : `Criar Métrica - Passo ${currentStep}/5`}
        size={isMobile ? 'full' : 'xlarge'}
        showCloseButton={false}
      >
        {/* Main Content - This goes into the scrollable area */}
        <div className={`flex ${showPreview ? 'gap-6' : ''} h-full`}>
          {/* Main Content */}
          <div className={`flex flex-col ${showPreview ? 'flex-1' : 'w-full'} h-full min-h-0`}>
            {/* Header with Auto-save & Export/Import */}
            <div className="pb-4 border-b border-slate-200 mb-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 truncate">
                    {mode === 'quick' ? 'Criar Métrica Rápida' : `Passo ${currentStep}/5`}
                  </h2>
                </div>
                
                {/* ✨ Auto-save indicator */}
                <AutoSaveIndicator
                  isSaving={autoSave.isSaving}
                  lastSavedText={autoSave.lastSavedText}
                  hasUnsavedChanges={autoSave.hasUnsavedChanges}
                />

                {/* ✨ Export/Import buttons (desktop only) */}
                {!isMobile && mode === 'full' && (
                  <ExportImportButtons
                    onExport={handleExport}
                    onImport={handleImport}
                    disabled={!data.name || !data.type}
                  />
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('quick')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'quick'
                      ? 'bg-white shadow-md text-emerald-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>Modo Rápido</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('full')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'full'
                      ? 'bg-white shadow-md text-sky-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span>Completo</span>
                </motion.button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pb-4 mb-4 flex-shrink-0">
              <WizardProgress
                mode={mode}
                currentStep={currentStep}
                totalSteps={totalSteps}
                isMobile={isMobile}
              />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait">
                {mode === 'quick' ? (
                  <QuickModeForm
                    key="quick"
                    data={data}
                    updateData={updateData}
                    isMobile={isMobile}
                  />
                ) : isMobile ? (
                  // ✨ Mobile: swipeable
                  (<motion.div
                    key={`step-${currentStep}`}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <FullWizardStep
                      step={currentStep}
                      data={data}
                      updateData={updateData}
                      isMobile={isMobile}
                    />
                  </motion.div>)
                ) : (
                  // Desktop: no swipe
                  (<FullWizardStep
                    key={`step-${currentStep}`}
                    step={currentStep}
                    data={data}
                    updateData={updateData}
                    isMobile={isMobile}
                  />)
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 mt-4 border-t border-slate-200 flex-shrink-0">
              {mode === 'quick' ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateQuick}
                  disabled={creating || createSuccess}
                  className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all min-h-[48px] ${
                    createSuccess
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {creating ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>A criar...</span>
                    </>
                  ) : createSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Criada!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Criar Métrica</span>
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePrevious}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-2 border-slate-200 bg-white rounded-xl text-slate-700 hover:border-sky-300 hover:text-sky-600 transition-all min-h-[48px]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={currentStep === 5 ? handleCreateFull : handleNext}
                    disabled={(currentStep === 5 && (creating || createSuccess)) || !canProceed(currentStep)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all min-h-[48px] ${
                      createSuccess
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                        : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {currentStep === 5 ? (
                      creating ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>A criar...</span>
                        </>
                      ) : createSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Criada!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Criar Métrica</span>
                        </>
                      )
                    ) : (
                      <>
                        <span>Próximo</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* ✨ Live Preview Sidebar (Desktop only) */}
          {showPreview && (
            <div className="hidden lg:block w-[400px] border-l border-slate-200 bg-slate-50 pl-6 overflow-y-auto">
              <LivePreview data={data} />
            </div>
          )}
        </div>
      </ResponsiveModal>
      {/* ✨ ADVANCED FEATURES MODALS */}
      {/* Draft Recovery */}
      <AnimatePresence>
        {showDraftRecovery && (
          <DraftRecoveryPrompt
            onRecover={handleRecoverDraft}
            onDiscard={handleDiscardDraft}
            draftAge={autoSave.lastSavedText || 'algum tempo'}
          />
        )}
      </AnimatePresence>
      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <ExportModal
            isOpen={showExport}
            onClose={() => setShowExport(false)}
            jsonData={exportJson}
            metricName={data.name || 'metric'}
          />
        )}
      </AnimatePresence>
      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <ImportModal
            isOpen={showImport}
            onClose={() => setShowImport(false)}
            onImport={handleImportData}
          />
        )}
      </AnimatePresence>
      {/* Post-Creation Modal */}
      <AnimatePresence>
        {showPostCreation && (
          <PostCreationModal
            isOpen={showPostCreation}
            metricName={data.name}
            onAddValue={() => {
              setShowPostCreation(false);
              onClose();
            }}
            onConfigureAutomation={() => {
              setShowPostCreation(false);
              onClose();
            }}
            onGoToLibrary={() => {
              setShowPostCreation(false);
              onClose();
            }}
            onClose={() => {
              setShowPostCreation(false);
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// QUICK MODE FORM
// ============================================================================

interface QuickModeFormProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  isMobile: boolean;
}

function QuickModeForm({ data, updateData, isMobile }: QuickModeFormProps) {
  const metricTypes: Array<{ value: MetricType; label: string; icon: string }> = [
    { value: 'scale', label: 'Escala Numérica', icon: '📊' },
    { value: 'boolean', label: 'Sim/Não', icon: '✅' },
    { value: 'duration', label: 'Duração', icon: '⏱️' },
    { value: 'distance', label: 'Distância', icon: '📏' },
    { value: 'count', label: 'Contagem', icon: '🔢' },
    { value: 'text', label: 'Texto', icon: '📝' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Name */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <span>Nome da Métrica</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="ex: RPE Sessão, Peso Corporal, Horas de Sono..."
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all min-h-[48px]"
        />
      </div>

      {/* Type */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <span>Tipo de Dados</span>
          <span className="text-red-500">*</span>
        </label>
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {metricTypes.map((type) => (
            <motion.button
              key={type.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateData({ type: type.value })}
              className={`p-3 rounded-xl border-2 transition-all min-h-[80px] ${
                data.type === type.value
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-xs font-semibold text-slate-900">{type.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Unit (optional) */}
      {(data.type === 'scale' || data.type === 'distance' || data.type === 'duration') && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span>Unidade</span>
            <span className="text-xs text-slate-500 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder={
              data.type === 'scale' ? 'ex: kg, RPE, bpm, %...' :
              data.type === 'distance' ? 'ex: km, m, mi...' :
              'ex: min, h, s...'
            }
            value={data.unit}
            onChange={(e) => updateData({ unit: e.target.value })}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all min-h-[48px]"
          />
        </div>
      )}

      {/* Helper */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <p className="text-sm text-emerald-800">
          <strong>💡 Modo Rápido:</strong> Cria a métrica com configurações padrão. Podes editar tudo depois na biblioteca.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// FULL WIZARD STEP
// ============================================================================

interface FullWizardStepProps {
  step: WizardStep;
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  isMobile: boolean;
}

function FullWizardStep({ step, data, updateData, isMobile }: FullWizardStepProps) {
  switch (step) {
    case 1:
      return <Step1BasicInfo data={data} updateData={updateData} isMobile={isMobile} />;
    case 2:
      return <Step2TypeValidation data={data} updateData={updateData} isMobile={isMobile} />;
    case 3:
      return <Step3ZonesBaseline data={data} updateData={updateData} isMobile={isMobile} />;
    case 4:
      return <Step4Categorization data={data} updateData={updateData} isMobile={isMobile} />;
    case 5:
      return <Step5Review data={data} isMobile={isMobile} />;
    default:
      return null;
  }
}