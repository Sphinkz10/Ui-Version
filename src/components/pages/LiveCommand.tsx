import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Calendar, Users, Activity, ArrowLeft } from 'lucide-react';
import { LiveCommandProvider } from '../live/LiveCommandContext';
import { LiveSession } from '../live/LiveSession';
import type { LiveWorkout } from '../live/types';

// Mock workout for demonstration
const DEMO_WORKOUT: LiveWorkout = {
  id: 'workout_demo_1',
  name: 'Treino Força - Upper Body',
  description: 'Treino focado em peito, ombros e tríceps com ênfase em hipertrofia',
  estimatedDuration: 90,
  intensity: 8,
  exercises: [
    {
      id: 'ex_warmup',
      name: 'Warm-up Dinâmico',
      description: 'Aquecimento geral com mobilidade articular',
      planned: {
        sets: 1,
        reps: '10 cada',
        rest: 30
      },
      status: 'pending',
      athleteData: {}
    },
    {
      id: 'ex_bench',
      name: 'Bench Press (Supino Reto)',
      description: 'Exercício principal para peito. Manter escápulas retraídas.',
      planned: {
        sets: 4,
        reps: '8-10',
        weight: 80,
        rest: 120,
        notes: 'Focar em controle excêntrico, 3 segundos descida'
      },
      status: 'pending',
      athleteData: {}
    },
    {
      id: 'ex_incline',
      name: 'Incline Dumbbell Press',
      description: 'Supino inclinado com halteres para porção superior do peito',
      planned: {
        sets: 3,
        reps: '10-12',
        weight: 32,
        rest: 90
      },
      status: 'pending',
      athleteData: {}
    },
    {
      id: 'ex_flyes',
      name: 'Cable Flyes',
      description: 'Crucifixo no cabo para isolamento do peito',
      planned: {
        sets: 3,
        reps: 15,
        weight: 25,
        rest: 60
      },
      status: 'pending',
      athleteData: {}
    },
    {
      id: 'ex_overhead',
      name: 'Overhead Press',
      description: 'Desenvolvimento com barra para ombros',
      planned: {
        sets: 4,
        reps: 8,
        weight: 50,
        rest: 120,
        notes: 'Cuidado com técnica, manter core estável'
      },
      status: 'pending',
      athleteData: {}
    },
    {
      id: 'ex_lateral',
      name: 'Lateral Raises',
      description: 'Elevação lateral com halteres',
      planned: {
        sets: 3,
        reps: 15,
        weight: 12,
        rest: 60
      },
      status: 'pending',
      athleteData: {}
    },
    {
      id: 'ex_pushdowns',
      name: 'Tricep Pushdowns',
      description: 'Extensão de tríceps no cabo',
      planned: {
        sets: 3,
        reps: 12,
        weight: 30,
        rest: 60
      },
      status: 'pending',
      athleteData: {}
    },
    {
      id: 'ex_overhead_tri',
      name: 'Overhead Tricep Extension',
      description: 'Extensão de tríceps overhead com haltere',
      planned: {
        sets: 3,
        reps: 12,
        weight: 20,
        rest: 60
      },
      status: 'pending',
      athleteData: {}
    }
  ]
};

export function LiveCommand() {
  const [activeLive, setActiveLive] = useState(false);
  const [selectedWorkout] = useState(DEMO_WORKOUT);

  // If live session is active, show it
  if (activeLive) {
    return (
      <LiveCommandProvider>
        <LiveSession
          calendarEventId="demo_event_1"
          workout={selectedWorkout}
          onExit={() => setActiveLive(false)}
          onComplete={(snapshot) => {
            setActiveLive(false);
          }}
        />
      </LiveCommandProvider>
    );
  }

  // Otherwise show the workout preview/selection page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-900 text-2xl sm:text-3xl mb-2">
              Live Command
            </h1>
            <p className="text-slate-600">
              Execução de sessões em tempo real com registro de performance
            </p>
          </div>
          
          <a 
            href="/calendar"
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 hover:border-sky-300 rounded-xl font-semibold text-slate-700 transition-all"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Voltar</span>
          </a>
        </div>

        {/* Session Preview Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-sky-500 to-cyan-400 p-6 sm:p-8 text-white">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Activity size={28} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium opacity-90 mb-1">SESSÃO DEMO</div>
                <h2 className="font-bold text-2xl sm:text-3xl">{selectedWorkout.name}</h2>
              </div>
            </div>
            <p className="text-sky-50">{selectedWorkout.description}</p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Calendar size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Duração</span>
                </div>
                <div className="font-bold text-2xl text-slate-900">
                  {selectedWorkout.estimatedDuration}min
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Activity size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Intensidade</span>
                </div>
                <div className="font-bold text-2xl text-amber-900">
                  {selectedWorkout.intensity}/10
                </div>
              </div>

              <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
                <div className="flex items-center gap-2 text-sky-600 mb-2">
                  <Activity size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Exercícios</span>
                </div>
                <div className="font-bold text-2xl text-sky-900">
                  {selectedWorkout.exercises.length}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Users size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Atletas</span>
                </div>
                <div className="font-bold text-2xl text-emerald-900">2</div>
              </div>
            </div>

            {/* Exercises List */}
            <div>
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                <Activity size={20} className="text-sky-500" />
                Exercícios do Treino
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {selectedWorkout.exercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 mb-1">{exercise.name}</div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span>{exercise.planned.sets} séries</span>
                        <span>•</span>
                        <span>{exercise.planned.reps} reps</span>
                        {exercise.planned.weight && (
                          <>
                            <span>•</span>
                            <span className="font-semibold">{exercise.planned.weight}kg</span>
                          </>
                        )}
                      </div>
                      {exercise.planned.notes && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <span>💡</span>
                          <span>{exercise.planned.notes}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Athletes Preview */}
            <div>
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                Atletas Participantes
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-full border-4 border-white flex items-center justify-center text-white font-bold shadow-lg">
                    J
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full border-4 border-white flex items-center justify-center text-white font-bold shadow-lg">
                    M
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold">João Silva</span> e <span className="font-semibold">Maria Costa</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sky-900 mb-1">Modo Live Session</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Registro em tempo real de todos os sets, reps, pesos e RPE de cada atleta. 
                    O sistema salva automaticamente um <strong>snapshot imutável</strong> ao finalizar a sessão 
                    com analytics completas de volume, intensidade e comparações vs histórico.
                  </p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setActiveLive(true)}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-lg"
            >
              <Play size={24} fill="currentColor" />
              INICIAR LIVE SESSION
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-sky-300 transition-colors">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
              <Activity size={24} className="text-sky-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Timer Inteligente</h3>
            <p className="text-sm text-slate-600">
              Cronômetro com pausa/resume, tempo ativo e descanso entre séries
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <Users size={24} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Multi-Atleta</h3>
            <p className="text-sm text-slate-600">
              Registre dados de múltiplos atletas simultaneamente com comparações em tempo real
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-amber-300 transition-colors">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar size={24} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Snapshot Imutável</h3>
            <p className="text-sm text-slate-600">
              Histórico completo da sessão com analytics e comparações automatizadas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
