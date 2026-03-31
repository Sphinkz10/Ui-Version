import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Users, MapPin, CalendarDays, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Modal } from '../shared/Modal';
import { toast } from 'sonner';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    duration: number;
    totalWorkouts: number;
    schedule: {
      week: number;
      day: number;
      workoutName: string;
      duration: number;
      type: string;
    }[];
  };
  onScheduled?: (events: any[]) => void;
}

export function BulkScheduleModal({
  isOpen,
  onClose,
  plan,
  onScheduled
}: BulkScheduleModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    athleteIds: [] as string[],
    defaultLocation: '',
    defaultTime: '09:00',
    notes: ''
  });

  const [availableAthletes] = useState([
    { id: '1', name: 'João Silva', avatar: '👨' },
    { id: '2', name: 'Maria Costa', avatar: '👩' },
    { id: '3', name: 'Pedro Santos', avatar: '👨' },
    { id: '4', name: 'Ana Ferreira', avatar: '👩' },
    { id: '5', name: 'Carlos Mendes', avatar: '👨' },
    { id: '6', name: 'Sofia Rodrigues', avatar: '👩' },
  ]);

  const handleBulkSchedule = async () => {
    // Gerar eventos baseado no plano
    const events = generateEventsFromPlan();

    toast.success(`${events.length} treinos agendados com sucesso!`, {
      description: `Plano "${plan.name}" distribuído no calendário`
    });

    onScheduled?.(events);
    onClose();
    resetForm();
  };

  const generateEventsFromPlan = () => {
    const startDate = new Date(formData.startDate);
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Segunda-feira
    const events = [];

    // Para cada sessão no plano
    for (const session of plan.schedule) {
      // Calcular data baseado em semana e dia
      const sessionDate = addDays(weekStart, (session.week - 1) * 7 + session.day - 1);
      
      // Parse hora padrão
      const [hours, minutes] = formData.defaultTime.split(':').map(Number);
      const startDateTime = new Date(sessionDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      // Calcular end_date baseado na duração
      const endDateTime = new Date(startDateTime.getTime() + session.duration * 60000);

      events.push({
        title: session.workoutName,
        type: session.type,
        status: 'scheduled',
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        plan_id: plan.id,
        location: formData.defaultLocation,
        athlete_ids: formData.athleteIds,
        notes: formData.notes,
        metadata: {
          plan_name: plan.name,
          week: session.week,
          day: session.day,
          scheduled_from: 'plan_bulk'
        }
      });
    }

    return events;
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      athleteIds: [],
      defaultLocation: '',
      defaultTime: '09:00',
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

  const selectAllAthletes = () => {
    setFormData(prev => ({
      ...prev,
      athleteIds: availableAthletes.map(a => a.id)
    }));
  };

  const deselectAllAthletes = () => {
    setFormData(prev => ({
      ...prev,
      athleteIds: []
    }));
  };

  // Preview dos eventos que serão criados
  const previewEvents = generateEventsFromPlan();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Distribuir Plano</h2>
            <p className="text-sm text-slate-600 mt-1">{plan.name}</p>
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
          <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`} />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Data de Início */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Info banner */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-sky-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-sky-900 mb-1">
                      Sobre a Distribuição
                    </p>
                    <p className="text-xs text-sky-700">
                      Este plano tem <strong>{plan.totalWorkouts} treinos</strong> distribuídos ao longo de{' '}
                      <strong>{plan.duration} dias</strong>. Escolha a data de início da primeira semana.
                    </p>
                  </div>
                </div>
              </div>

              {/* Start date picker */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data de Início (Segunda-feira da Semana 1)
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Primeira sessão: {plan.schedule[0]?.workoutName} em{' '}
                  {format(
                    addDays(startOfWeek(new Date(formData.startDate), { weekStartsOn: 1 }), plan.schedule[0]?.day - 1),
                    "EEEE, d 'de' MMMM",
                    { locale: pt }
                  )}
                </p>
              </div>

              {/* Default time */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hora Padrão das Sessões
                </label>
                <input
                  type="time"
                  value={formData.defaultTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultTime: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Todas as sessões começarão neste horário (podes ajustar individualmente depois)
                </p>
              </div>

              {/* Default location */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Localização Padrão (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ginásio Principal..."
                  value={formData.defaultLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultLocation: e.target.value }))}
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

          {/* Step 2: Selecionar Atletas */}
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4 inline mr-1" />
                    Atletas ({formData.athleteIds.length} selecionados)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllAthletes}
                      className="text-xs text-sky-600 font-medium hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={deselectAllAthletes}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Nenhum
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-xl">
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
                  Notas do Plano (opcional)
                </label>
                <textarea
                  placeholder="Observações gerais sobre este ciclo de treino..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all resize-none"
                />
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
                  onClick={() => setStep(3)}
                  disabled={formData.athleteIds.length === 0}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Revisar
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview & Confirm */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 mb-2">
                      Pronto para agendar
                    </p>
                    <div className="space-y-1 text-xs text-emerald-700">
                      <p>📅 Início: {format(new Date(formData.startDate), "d 'de' MMMM", { locale: pt })}</p>
                      <p>⏰ Horário padrão: {formData.defaultTime}</p>
                      {formData.defaultLocation && <p>📍 Local: {formData.defaultLocation}</p>}
                      <p>👥 {formData.athleteIds.length} atleta(s) atribuídos</p>
                      <p className="font-bold mt-2">
                        🎯 {previewEvents.length} eventos serão criados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview list */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Preview dos Eventos
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-xl">
                  {previewEvents.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200"
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(event.start_date), "EEE, d/MM 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {Math.round((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / 60000)}min
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-700">
                      Os eventos serão criados imediatamente. Podes editá-los individualmente no calendário depois de criados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Voltar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBulkSchedule}
                  className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all"
                >
                  <Zap className="h-4 w-4 inline mr-1" />
                  Criar {previewEvents.length} Eventos
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
