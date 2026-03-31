import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Clock, Users, ChevronRight, Play, Pause, RotateCcw, Plus, Search, Dumbbell } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface ExecuteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    id: string;
    title: string;
    time: string;
    athletes: number;
    template: string;
  };
  mode?: "template" | "coach"; // template = valores pre-definidos, coach = inserir sempre
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: string;
  weight?: number;
  duration?: number;
  rest?: number;
  notes?: string;
}

interface Block {
  id: string;
  name: string;
  color: string;
  exercises: Exercise[];
}

interface ExerciseLog {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  completed: boolean;
}

export function ExecuteSessionModal({ isOpen, onClose, sessionData, mode = "template" }: ExecuteSessionModalProps) {
  // Template mock data - NOW MUTABLE
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "1",
      name: "Aquecimento",
      color: "amber",
      exercises: [
        { id: "e1", name: "Mobilidade Ombros", sets: 2, duration: 30, rest: 30 },
        { id: "e2", name: "Jump Rope", sets: 3, duration: 60, rest: 30 }
      ]
    },
    {
      id: "2",
      name: "Bloco Principal - Força",
      color: "emerald",
      exercises: [
        { id: "e3", name: "Back Squat", sets: 4, reps: "8-10", weight: 60, rest: 90 },
        { id: "e4", name: "Bench Press", sets: 4, reps: "8-10", weight: 50, rest: 90 },
        { id: "e5", name: "Deadlift", sets: 3, reps: "6-8", weight: 80, rest: 120 }
      ]
    },
    {
      id: "3",
      name: "Bloco Acessório",
      color: "sky",
      exercises: [
        { id: "e6", name: "Dumbbell Row", sets: 3, reps: "12-15", weight: 20, rest: 60 },
        { id: "e7", name: "Shoulder Press", sets: 3, reps: "12-15", weight: 15, rest: 60 }
      ]
    },
    {
      id: "4",
      name: "Finisher",
      color: "violet",
      exercises: [
        { id: "e8", name: "Plank", sets: 3, duration: 45, rest: 30 },
        { id: "e9", name: "Russian Twist", sets: 3, reps: "20", rest: 30 }
      ]
    }
  ]);

  // Exercise library for quick add
  const exerciseLibrary: Omit<Exercise, 'id'>[] = [
    { name: "Push-ups", sets: 3, reps: "10-15", rest: 60 },
    { name: "Pull-ups", sets: 3, reps: "5-8", rest: 90 },
    { name: "Lunges", sets: 3, reps: "12", rest: 60 },
    { name: "Burpees", sets: 3, reps: "10", rest: 60 },
    { name: "Mountain Climbers", sets: 3, duration: 45, rest: 45 },
    { name: "Kettlebell Swing", sets: 3, reps: "15", weight: 16, rest: 60 },
    { name: "Box Jumps", sets: 3, reps: "10", rest: 90 },
    { name: "Wall Balls", sets: 3, reps: "15", rest: 60 },
    { name: "Farmer's Walk", sets: 3, duration: 60, weight: 24, rest: 90 },
    { name: "Battle Ropes", sets: 3, duration: 30, rest: 45 },
  ];

  // Add exercise modal state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter exercises based on search
  const filteredExercises = exerciseLibrary.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle adding exercise to current block
  const handleAddExercise = (exercise: Omit<Exercise, 'id'>) => {
    // Find current block based on current exercise
    const currentBlockIndex = blocks.findIndex(block =>
      block.exercises.some(ex => ex.id === currentExercise.id)
    );

    if (currentBlockIndex === -1) return;

    // Create new exercise with unique ID
    const newExercise: Exercise = {
      ...exercise,
      id: `e${Date.now()}`
    };

    // Add to current block
    const updatedBlocks = [...blocks];
    updatedBlocks[currentBlockIndex] = {
      ...updatedBlocks[currentBlockIndex],
      exercises: [...updatedBlocks[currentBlockIndex].exercises, newExercise]
    };

    setBlocks(updatedBlocks);
    setShowAddExercise(false);
    setSearchQuery("");
    toast.success(`${exercise.name} adicionado ao treino! 💪`);
  };

  // Helper function for color classes
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { header: string, progress: string, icon: string }> = {
      amber: {
        header: "bg-gradient-to-r from-amber-50 to-white",
        progress: "bg-gradient-to-r from-amber-500 to-amber-600",
        icon: "bg-gradient-to-br from-amber-500 to-amber-600"
      },
      emerald: {
        header: "bg-gradient-to-r from-emerald-50 to-white",
        progress: "bg-gradient-to-r from-emerald-500 to-emerald-600",
        icon: "bg-gradient-to-br from-emerald-500 to-emerald-600"
      },
      sky: {
        header: "bg-gradient-to-r from-sky-50 to-white",
        progress: "bg-gradient-to-r from-sky-500 to-sky-600",
        icon: "bg-gradient-to-br from-sky-500 to-sky-600"
      },
      violet: {
        header: "bg-gradient-to-r from-violet-50 to-white",
        progress: "bg-gradient-to-r from-violet-500 to-violet-600",
        icon: "bg-gradient-to-br from-violet-500 to-violet-600"
      }
    };
    return colorMap[color] || colorMap.emerald;
  };

  // Flatten all exercises into a single array
  const allExercises = blocks.flatMap(block => 
    block.exercises.map(ex => ({ ...ex, blockColor: block.color, blockName: block.name }))
  );

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [sessionStartTime] = useState(new Date());
  const [sessionElapsed, setSessionElapsed] = useState(0);

  // Current exercise and set data
  const currentExercise = allExercises[currentExerciseIndex];
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [currentDuration, setCurrentDuration] = useState<number>(0);

  // Initialize values when exercise changes
  useEffect(() => {
    if (currentExercise) {
      if (mode === "template") {
        setCurrentReps(currentExercise.reps ? parseInt(currentExercise.reps.split('-')[0]) : 0);
        setCurrentWeight(currentExercise.weight || 0);
        setCurrentDuration(currentExercise.duration || 0);
      } else {
        setCurrentReps(0);
        setCurrentWeight(0);
        setCurrentDuration(0);
      }
    }
  }, [currentExerciseIndex, currentSet, currentExercise, mode]);

  // Session timer
  useEffect(() => {
    if (!isOpen || isPaused) return;
    
    const interval = setInterval(() => {
      setSessionElapsed(Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, sessionStartTime, isPaused]);

  // Rest timer
  useEffect(() => {
    if (!isResting || restTimeLeft <= 0 || isPaused) return;

    const interval = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          setIsResting(false);
          // Play sound or notification here
          toast.success("Descanso terminado! 💪");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting, restTimeLeft, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = () => {
    // Log the set
    const newLog: ExerciseLog = {
      exerciseId: currentExercise.id,
      setNumber: currentSet,
      reps: currentReps || undefined,
      weight: currentWeight || undefined,
      duration: currentDuration || undefined,
      completed: true
    };
    setLogs([...logs, newLog]);

    // Check if this was the last set
    if (currentSet < currentExercise.sets) {
      // More sets remaining - start rest
      const restTime = currentExercise.rest || 60;
      setRestTimeLeft(restTime);
      setIsResting(true);
      setCurrentSet(currentSet + 1);
    } else {
      // Last set - move to next exercise
      if (currentExerciseIndex < allExercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
      } else {
        // Session complete!
        handleFinishSession();
      }
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const handleFinishSession = () => {
    const totalSets = allExercises.reduce((acc, ex) => acc + ex.sets, 0);
    const completedSets = logs.filter(log => log.completed).length;
    
    toast.success(`🎉 Sessão finalizada! ${completedSets}/${totalSets} séries completadas em ${formatTime(sessionElapsed)}`);
    onClose();
  };

  const getTotalSets = () => {
    return allExercises.reduce((acc, ex) => acc + ex.sets, 0);
  };

  const getCompletedSets = () => {
    return logs.filter(log => log.completed).length;
  };

  const progress = (getCompletedSets() / getTotalSets()) * 100;

  if (!isOpen || !currentExercise) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            const confirm = window.confirm("Sair sem finalizar a sessão?");
            if (confirm) onClose();
          }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className={`p-6 border-b border-slate-200 ${getColorClasses(currentExercise.blockColor).header}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900 mb-1">
                  🏋️ {sessionData.title}
                </h2>
                <p className="text-sm text-slate-600">
                  {currentExercise.blockName} • {mode === "template" ? "Modo Template" : "Modo Coach"}
                </p>
              </div>
              <div className="flex gap-2">
                {/* ADD EXERCISE BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddExercise(true)}
                  className="h-8 w-8 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 flex items-center justify-center transition-all"
                  title="Adicionar exercício"
                >
                  <Plus className="h-5 w-5 text-white" />
                </motion.button>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  {isPaused ? <Play className="h-5 w-5 text-slate-600" /> : <Pause className="h-5 w-5 text-slate-600" />}
                </button>
                <button
                  onClick={() => {
                    const confirm = window.confirm("Sair sem finalizar a sessão?");
                    if (confirm) onClose();
                  }}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progresso</span>
                <span className="font-semibold text-slate-900">
                  {getCompletedSets()}/{getTotalSets()} séries • {formatTime(sessionElapsed)}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={`h-full ${getColorClasses(currentExercise.blockColor).progress} rounded-full`}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* REST SCREEN */}
              {isResting ? (
                <motion.div
                  key="rest"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center h-full min-h-[400px]"
                >
                  <div className="text-center">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-sky-100 mb-4">
                        <Clock className="h-12 w-12 text-sky-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">Descanso</h3>
                      <p className="text-sm text-slate-600">Próxima série em breve...</p>
                    </div>

                    {/* Timer */}
                    <div className="mb-8">
                      <div className="text-6xl font-bold text-slate-900 mb-2">
                        {formatTime(restTimeLeft)}
                      </div>
                      <div className="w-64 mx-auto h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${(restTimeLeft / (currentExercise.rest || 60)) * 100}%` }}
                          className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Next Set Info */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-6">
                      <p className="text-sm text-slate-600 mb-1">Próxima série</p>
                      <p className="font-semibold text-slate-900">
                        {currentExercise.name} - Série {currentSet}/{currentExercise.sets}
                      </p>
                      {currentExercise.reps && (
                        <p className="text-sm text-slate-600 mt-1">{currentExercise.reps} reps</p>
                      )}
                    </div>

                    <button
                      onClick={handleSkipRest}
                      className="px-6 py-3 text-sm font-semibold rounded-xl border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all"
                    >
                      Pular Descanso
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* EXERCISE SCREEN */
                (<motion.div
                  key="exercise"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Exercise Info */}
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${getColorClasses(currentExercise.blockColor).icon} mb-4`}>
                      <span className="text-2xl font-bold text-white">
                        {currentExerciseIndex + 1}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">
                      {currentExercise.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Série {currentSet} de {currentExercise.sets}
                    </p>
                  </div>
                  {/* Input Values */}
                  <div className="space-y-4">
                    {/* Reps */}
                    {currentExercise.reps && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Repetições {mode === "template" && `(Alvo: ${currentExercise.reps})`}
                        </label>
                        <input
                          type="number"
                          value={currentReps || ""}
                          onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                          placeholder={currentExercise.reps}
                          className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-center font-semibold text-2xl"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Weight */}
                    {currentExercise.weight !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Peso (kg) {mode === "template" && `(Alvo: ${currentExercise.weight}kg)`}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentWeight || ""}
                          onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                          placeholder={currentExercise.weight?.toString()}
                          className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-center font-semibold text-2xl"
                        />
                      </div>
                    )}

                    {/* Duration */}
                    {currentExercise.duration && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Duração (segundos) {mode === "template" && `(Alvo: ${currentExercise.duration}s)`}
                        </label>
                        <input
                          type="number"
                          value={currentDuration || ""}
                          onChange={(e) => setCurrentDuration(parseInt(e.target.value) || 0)}
                          placeholder={currentExercise.duration?.toString()}
                          className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-center font-semibold text-2xl"
                        />
                      </div>
                    )}
                  </div>
                  {/* Previous Sets (if any) */}
                  {currentSet > 1 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-medium text-slate-500 mb-2">Séries anteriores</p>
                      <div className="space-y-1">
                        {logs
                          .filter(log => log.exerciseId === currentExercise.id)
                          .map((log, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Série {log.setNumber}</span>
                              <span className="font-medium text-slate-900">
                                {log.reps && `${log.reps} reps`}
                                {log.weight && ` @ ${log.weight}kg`}
                                {log.duration && `${log.duration}s`}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {/* Mode Info */}
                  {mode === "template" && (
                    <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
                      <p className="text-xs text-sky-900">
                        💡 <strong>Modo Template:</strong> Valores sugeridos pré-carregados. Edite se necessário.
                      </p>
                    </div>
                  )}
                  {mode === "coach" && (
                    <div className="rounded-xl bg-violet-50 border border-violet-200 p-3">
                      <p className="text-xs text-violet-900">
                        💡 <strong>Modo Coach:</strong> Insira os valores executados pelo atleta.
                      </p>
                    </div>
                  )}
                </motion.div>)
              )}
            </AnimatePresence>
          </div>

          {/* Footer - Only show on exercise screen */}
          {!isResting && (
            <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  const confirm = window.confirm("Pausar sessão?");
                  if (confirm) onClose();
                }}
                className="px-6 py-3 text-sm font-semibold rounded-xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
              >
                Pausar
              </button>
              <button
                onClick={handleCompleteSet}
                disabled={
                  (currentExercise.reps && !currentReps) ||
                  (currentExercise.weight !== undefined && !currentWeight) ||
                  (currentExercise.duration && !currentDuration)
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentSet < currentExercise.sets ? (
                  <>
                    <Check className="h-5 w-5" />
                    Completar Série {currentSet}
                  </>
                ) : currentExerciseIndex < allExercises.length - 1 ? (
                  <>
                    Próximo Exercício
                    <ChevronRight className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Finalizar Sessão
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* ADD EXERCISE MODAL */}
        <AnimatePresence>
          {showAddExercise && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-4 z-10"
            >
              <div 
                className="absolute inset-0 bg-black/30" 
                onClick={() => setShowAddExercise(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md max-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">Adicionar Exercício</h3>
                    <button
                      onClick={() => setShowAddExercise(false)}
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      <X className="h-5 w-5 text-slate-600" />
                    </button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Procurar exercício..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Exercise List */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {filteredExercises.length > 0 ? (
                      filteredExercises.map((exercise, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAddExercise(exercise)}
                          className="w-full p-3 rounded-xl border-2 border-slate-200 hover:border-sky-300 bg-white hover:bg-sky-50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Dumbbell className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 text-sm">{exercise.name}</p>
                              <p className="text-xs text-slate-600">
                                {exercise.sets} séries
                                {exercise.reps && ` • ${exercise.reps} reps`}
                                {exercise.duration && ` • ${exercise.duration}s`}
                                {exercise.weight && ` • ${exercise.weight}kg`}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-slate-500">Nenhum exercício encontrado</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-600 text-center">
                    💡 O exercício será adicionado ao bloco atual: <strong>{currentExercise.blockName}</strong>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}