/**
 * WIZARD MAIN - Orchestrator
 * Main wizard component that manages state and navigation
 */

'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Step1SourcePicker } from './Step1SourcePicker';
import { Step2ConditionsBuilder } from './Step2ConditionsBuilder';
import { Step3ActionsBuilder } from './Step3ActionsBuilder';
import { Step4TemplateDeployment } from './Step4TemplateDeployment';
import type { WizardState } from '@/types/wizard';
import { toast } from 'sonner@2.0.3';

interface WizardMainProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (metric: any) => void;
  workspaceId: string;
}

export function WizardMain({ isOpen, onClose, onComplete, workspaceId }: WizardMainProps) {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    source: null,
    trigger: {
      type: 'always',
    },
    actions: [],
    metricName: '',
    metricDescription: '',
    template: {
      saveAsTemplate: false,
      tags: [],
      isPublic: false,
    },
    deployment: {
      target: 'all-athletes',
      automationEnabled: false,
      includeInReports: true,
    },
    workspaceId,
  });

  const handleNext = useCallback(() => {
    if (wizardState.currentStep < 4) {
      setWizardState(prev => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as 1 | 2 | 3 | 4,
      }));
    }
  }, [wizardState.currentStep]);

  const handleBack = useCallback(() => {
    if (wizardState.currentStep > 1) {
      setWizardState(prev => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as 1 | 2 | 3 | 4,
      }));
    }
  }, [wizardState.currentStep]);

  const handleFinish = useCallback(async () => {
    try {
      toast.success('Métrica criada com sucesso!', {
        description: `"${wizardState.metricName}" foi ${wizardState.deployment.target === 'test-only' ? 'guardada em modo teste' : 'aplicada aos atletas'}`,
      });

      if (onComplete) {
        // Build final metric object
        const metric = {
          id: `metric-${Date.now()}`,
          name: wizardState.metricName,
          description: wizardState.metricDescription,
          workspaceId,
          source: wizardState.source,
          trigger: wizardState.trigger,
          actions: wizardState.actions,
          template: wizardState.template,
          deployment: wizardState.deployment,
          createdAt: new Date().toISOString(),
        };
        
        onComplete(metric);
      }

      // Reset and close
      setWizardState({
        currentStep: 1,
        source: null,
        trigger: { type: 'always' },
        actions: [],
        metricName: '',
        metricDescription: '',
        template: { saveAsTemplate: false, tags: [], isPublic: false },
        deployment: { target: 'all-athletes', automationEnabled: false, includeInReports: true },
        workspaceId,
      });

      onClose();
    } catch (error) {
      console.error('Error creating metric:', error);
      toast.error('Erro ao criar métrica', {
        description: 'Por favor tenta novamente.',
      });
    }
  }, [wizardState, onClose, onComplete, workspaceId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl h-[95vh] sm:max-h-[90vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="wait">
          {wizardState.currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step1SourcePicker
                selectedSource={wizardState.source}
                onSourceSelect={(source) => setWizardState(prev => ({ ...prev, source }))}
                onNext={handleNext}
                onCancel={onClose}
              />
            </motion.div>
          )}

          {wizardState.currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step2ConditionsBuilder
                source={wizardState.source!}
                trigger={wizardState.trigger}
                onTriggerChange={(trigger) => setWizardState(prev => ({ ...prev, trigger }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {wizardState.currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step3ActionsBuilder
                source={wizardState.source!}
                trigger={wizardState.trigger}
                actions={wizardState.actions}
                onActionsChange={(actions) => setWizardState(prev => ({ ...prev, actions }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {wizardState.currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step4TemplateDeployment
                source={wizardState.source!}
                trigger={wizardState.trigger}
                actions={wizardState.actions}
                metricName={wizardState.metricName}
                metricDescription={wizardState.metricDescription || ''}
                template={wizardState.template}
                deployment={wizardState.deployment}
                onMetricNameChange={(name) => setWizardState(prev => ({ ...prev, metricName: name }))}
                onMetricDescriptionChange={(desc) => setWizardState(prev => ({ ...prev, metricDescription: desc }))}
                onTemplateChange={(template) => setWizardState(prev => ({ ...prev, template }))}
                onDeploymentChange={(deployment) => setWizardState(prev => ({ ...prev, deployment }))}
                onFinish={handleFinish}
                onBack={handleBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}