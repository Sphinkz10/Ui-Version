import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Users, MapPin, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Modal } from '../shared/Modal';
import { toast } from 'sonner';

interface ScheduleWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: {
    id: string;
    name: string;
    duration: number;
    category: string;
  };
  onScheduled?: (event: any) => void;
}

export function ScheduleWorkoutModal({
  isOpen,
  onClose,
  workout,
  onScheduled
}: ScheduleWorkoutModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    location: '',
    athleteIds: [] as string[],
    notes: ''
  });

  const [availableAthletes] = useState([
    { id: '1', name: 'João Silva', avatar: '👨' },
    { id: '2', name: 'Maria Costa', avatar: '👩' },
    { id: '3', name: 'Pedro Santos', avatar: '👨' },
    { id: '4', name: 'Ana Ferreira', avatar: '👩' },
  ]);

  const handleSchedule = async () => {
    // Calcular end_date baseado na duração do workout
    const startDate = new Date(`${formData.date}T${formData.time}`);
    const endDate = new Date(startDate.getTime() + workout.duration * 60000);

    const event = {
      title: workout.name,
      type: 'workout',
      status: 'scheduled',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      workout_id: workout.id,
      location: formData.location,
      athlete_ids: formData.athleteIds,
      notes: formData.notes,
      metadata: {
        workout_category: workout.category,
        scheduled_from: 'workout_library'
      }
    };

    toast.success(`Treino "${workout.name}" agendado para ${format(startDate, "d 'de' MMMM 'às' HH:mm", { locale: pt })}`);

    onScheduled?.(event);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      location: '',
      athleteIds: [],
      notes: ''
    });
  };

  const toggleAthlete = (athleteId: string) => {
    setFormData(prev => ({
      ...prev,
      athleteIds: prev.athleteIds.includes(athleteId)
        ? prev.athleteIds.filter(id => id !== athleteId)
        : [...prev.athleteIds, athleteId]
    }));
  };

  // Quick date shortcuts
  const quickDates = [
    { label: 'Hoje', date: new Date() },
    { label: 'Amanhã', date: addDays(new Date(), 1) },
    { label: 'Esta Semana', date: addDays(new Date(), 3) },
    { label: 'Próxima Semana', date: addDays(new Date(), 7) }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Agendar Treino</h2>
            <p className="text-sm text-slate-600 mt-1">{workout.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-sky-500' : 'bg-slate-200'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`} />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Data e Hora */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Quick date shortcuts */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Atalhos Rápidos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quickDates.map((quick) => (
                    <motion.button
                      key={quick.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        date: format(quick.date, 'yyyy-MM-dd') 
                      }))}
                      className="px-3 py-2 text-sm font-medium rounded-xl border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all"
                    >
                      {quick.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                />
              </div>

              {/* Time picker */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Hora de Início
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Duração: {workout.duration}min (termina às {
                    format(
                      new Date(new Date(`2000-01-01T${formData.time}`).getTime() + workout.duration * 60000),
                      'HH:mm'
                    )
                  })
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Localização (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ginásio Principal, Campo 1..."
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all"
                >
                  Próximo
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Atletas e Notas */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Athletes selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Atletas ({formData.athleteIds.length} selecionados)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                  {availableAthletes.map((athlete) => (
                    <motion.button
                      key={athlete.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleAthlete(athlete.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                        formData.athleteIds.includes(athlete.id)
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-lg">{athlete.avatar}</span>
                      <span className="font-medium truncate">{athlete.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notas Internas (opcional)
                </label>
                <textarea
                  placeholder="Adicione observações sobre esta sessão..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all resize-none"
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
                <p className="text-xs font-semibold text-sky-700 mb-2">Resumo</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <p>📅 {format(new Date(formData.date), "EEEE, d 'de' MMMM", { locale: pt })}</p>
                  <p>⏰ {formData.time} ({workout.duration}min)</p>
                  {formData.location && <p>📍 {formData.location}</p>}
                  <p>👥 {formData.athleteIds.length || 'Nenhum'} atleta(s)</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Voltar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSchedule}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all"
                >
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Agendar Treino
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
