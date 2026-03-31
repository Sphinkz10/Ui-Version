import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Play, Pause, ChevronLeft, ChevronRight, 
  Check, Clock, Users, Activity, Plus, Search, List, GripVertical
} from 'lucide-react';
import { useLiveCommand } from './LiveCommandContext';
import { LiveExerciseView } from './LiveExerciseView';
import { LiveAthleteCard } from './LiveAthleteCard';
import { LiveCompletionModal } from './LiveCompletionModal';
import type { LiveWorkout } from './types';

interface LiveSessionProps {
  calendarEventId: string;
  workout: LiveWorkout;
  onExit: () => void;
  onComplete?: (snapshot: any) => void;
}

export function LiveSession({ calendarEventId, workout, onExit, onComplete }: LiveSessionProps) {
  const {
    session,
    isActive,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    nextExercise,
    previousExercise
  } = useLiveCommand();

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Auto-start session
  useEffect(() => {
    if (!session) {
      // Buscar calendário event do DataStore
      const mockEvent = {
        id: calendarEventId,
        title: workout.name,
        type: 'workout' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        allDay: false,
        status: 'in-progress' as const,
        color: '#0ea5e9',
        athleteIds: ['ath_1', 'ath_2'], // TODO: Pegar do evento real
        attendance: {},
        metadata: {},
        notificationsSent: false
      };

      startSession(
        {
          sessionId: `live_${Date.now()}`,
          calendarEvent: mockEvent,
          coachId: 'coach_1' // TODO: Pegar do auth
        },
        workout
      );
    }
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-300 text-lg">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  const currentExercise = session.workout.exercises[session.currentExerciseIndex];
  const isFirstExercise = session.currentExerciseIndex === 0;
  const isLastExercise = session.currentExerciseIndex === session.workout.exercises.length - 1;
  
  // Format timer
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const handleComplete = async () => {
    const snap = await completeSession();
    setSnapshot(snap);
    setShowCompletionModal(true);
  };

  // Exercise library
  const exerciseLibrary = [
    { name: 'Push-ups', sets: 3, reps: '10-15', category: 'Peito' },
    { name: 'Pull-ups', sets: 3, reps: '5-8', category: 'Costas' },
    { name: 'Squats', sets: 4, reps: '12', category: 'Pernas' },
    { name: 'Lunges', sets: 3, reps: '12', category: 'Pernas' },
    { name: 'Plank', sets: 3, duration: 45, category: 'Core' },
    { name: 'Burpees', sets: 3, reps: '10', category: 'Full Body' },
    { name: 'Bench Press', sets: 4, reps: '8-10', category: 'Peito' },
    { name: 'Deadlift', sets: 4, reps: '6-8', category: 'Costas' },
    { name: 'Shoulder Press', sets: 3, reps: '10-12', category: 'Ombros' },
    { name: 'Bicep Curls', sets: 3, reps: '12-15', category: 'Braços' },
    { name: 'Tricep Dips', sets: 3, reps: '10-12', category: 'Braços' },
    { name: 'Leg Press', sets: 4, reps: '12', category: 'Pernas' },
  ];

  // Filter exercises based on search query
  const filteredExercises = exerciseLibrary.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-4 sm:px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* Left - Back + Title */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onExit}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg sm:text-xl">{session.workout.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Activity size={14} />
                  <span>
                    {session.currentExerciseIndex + 1}/{session.workout.exercises.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{session.athletes.length} atletas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Timer + Controls */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs text-slate-400">Tempo Ativo</div>
              <div className="font-mono font-bold text-xl text-sky-400">
                {formatTime(session.timer.active)}
              </div>
            </div>
            
            {session.status === 'active' && (
              <button
                onClick={pauseSession}
                className="p-3 bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"
              >
                <Pause size={20} />
              </button>
            )}
            
            {session.status === 'paused' && (
              <button
                onClick={resumeSession}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors"
              >
                <Play size={20} />
              </button>
            )}
          </div>

          {/* Right - Status Badge */}
          <div className="flex items-center gap-3">
            {session.status === 'active' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-sm">AO VIVO</span>
              </div>
            )}
            {session.status === 'paused' && (
              <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-full">
                <span className="font-semibold text-sm">PAUSADO</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Progresso da Sessão</span>
            <span>{Math.round((session.currentExerciseIndex / session.workout.exercises.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${(session.currentExerciseIndex / session.workout.exercises.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Exercise List */}
        <aside className="w-72 bg-slate-800/50 border-r border-slate-700 overflow-y-auto hidden lg:block">
          <div className="p-4 flex flex-col h-full">
            <h3 className="font-semibold text-sm text-slate-400 mb-3 uppercase tracking-wider">
              Exercícios
            </h3>
            <div className="space-y-2 flex-1">
              {session.workout.exercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  onClick={() => {}}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    index === session.currentExerciseIndex
                      ? 'bg-sky-500/20 border-2 border-sky-500'
                      : exercise.status === 'completed'
                      ? 'bg-emerald-500/10 border-2 border-emerald-500/30'
                      : 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${
                          exercise.status === 'completed' ? 'text-emerald-400' :
                          exercise.status === 'active' ? 'text-sky-400' :
                          'text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm">{exercise.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {exercise.planned.sets}×{exercise.planned.reps} 
                        {exercise.planned.weight && ` @ ${exercise.planned.weight}kg`}
                      </div>
                    </div>
                    {exercise.status === 'completed' && (
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                    )}
                    {exercise.status === 'active' && (
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* ADD EXERCISE BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddExercise(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-lg transition-all"
            >
              <Plus size={18} />
              <span>Adicionar Exercício</span>
            </motion.button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Current Exercise */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentExercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LiveExerciseView exercise={currentExercise} />
              </motion.div>
            </AnimatePresence>

            {/* Athletes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {session.athletes.map(athlete => (
                <LiveAthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  currentExercise={currentExercise}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
      {/* Footer Controls */}
      <footer className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Buttons - Show only on mobile */}
          <div className="lg:hidden flex gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddExercise(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-lg transition-all"
            >
              <Plus size={18} />
              <span>Adicionar</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExerciseList(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 hover:border-sky-500 transition-all"
            >
              <List size={18} />
              <span>Lista ({session.workout.exercises.length})</span>
            </motion.button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            {/* Previous */}
            <button
              onClick={previousExercise}
              disabled={isFirstExercise}
              className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Complete */}
            {isLastExercise && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-semibold shadow-lg transition-all"
              >
                <Check size={20} />
                Concluir Sessão
              </button>
            )}

            {/* Next */}
            <button
              onClick={nextExercise}
              disabled={isLastExercise}
              className="flex items-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all ml-auto"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </footer>
      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && snapshot && (
          <LiveCompletionModal
            snapshot={snapshot}
            onClose={() => {
              setShowCompletionModal(false);
              onComplete?.(snapshot);
              onExit();
            }}
          />
        )}
      </AnimatePresence>
      {/* EXERCISE LIST MODAL - with Drag & Drop */}
      <AnimatePresence>
        {showExerciseList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowExerciseList(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-700"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-violet-500/10 to-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Lista de Exercícios</h3>
                    <p className="text-sm text-slate-400">Arraste para reordenar</p>
                  </div>
                  <button
                    onClick={() => setShowExerciseList(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  {session.workout.exercises.map((exercise, index) => (
                    <motion.div
                      key={exercise.id}
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedIndex !== null && draggedIndex !== index) {}
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-move ${
                        draggedIndex === index
                          ? 'opacity-50 border-sky-500'
                          : index === session.currentExerciseIndex
                          ? 'bg-sky-500/20 border-sky-500'
                          : exercise.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        <GripVertical size={20} className="text-slate-400 flex-shrink-0" />

                        {/* Exercise Number */}
                        <div className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${
                          exercise.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          exercise.status === 'active' ? 'bg-sky-500/20 text-sky-400' :
                          'bg-slate-600 text-slate-300'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Exercise Details */}
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-1">{exercise.name}</h4>
                          <p className="text-sm text-slate-400">
                            {exercise.planned.sets}×{exercise.planned.reps}
                            {exercise.planned.weight && ` @ ${exercise.planned.weight}kg`}
                          </p>
                        </div>

                        {/* Status Icon */}
                        {exercise.status === 'completed' && (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Check size={20} />
                            <span className="text-xs font-medium">Completo</span>
                          </div>
                        )}
                        {exercise.status === 'active' && (
                          <div className="flex items-center gap-2 text-sky-400">
                            <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium">Ativo</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ADD EXERCISE MODAL */}
      <AnimatePresence>
        {showAddExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddExercise(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-700"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-sky-500/10 to-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Adicionar Exercício</h3>
                    <p className="text-sm text-slate-400">Escolha um exercício da biblioteca</p>
                  </div>
                  <button
                    onClick={() => setShowAddExercise(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Procurar exercício ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">Nenhum exercício encontrado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredExercises.map((exercise, index) => (
                      <motion.button
                        key={exercise.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowAddExercise(false);
                          setSearchQuery(''); // Reset search
                        }}
                        className="p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 border-2 border-slate-600 hover:border-sky-500 transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-white">{exercise.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-medium shrink-0">
                            {exercise.category}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400">
                          {exercise.sets} séries × {exercise.reps || `${exercise.duration}s`}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}