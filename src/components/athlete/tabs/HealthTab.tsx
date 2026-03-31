/**
 * HEALTH TAB - DAY 6 ENHANCED ✅
 * Gestão de saúde, lesões e recuperação do atleta
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, AlertCircle, CheckCircle, Clock, TrendingUp,
  Plus, Activity, Stethoscope, Pill, UserCheck, Calendar
} from 'lucide-react';
import { getInjuriesByAthleteId, formatDate } from '@/lib/mockData';
import { CreateInjuryModal, InjuryFormData, Injury } from '@/components/athlete/modals/CreateInjuryModal';
import { InjuryDetailsDrawer } from '@/components/athlete/drawers/InjuryDetailsDrawer';
import { toast } from 'sonner';

interface HealthTabProps {
  athleteId: string;
}

export function HealthTab({ athleteId }: HealthTabProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'recovering' | 'recovered'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);
  const [injuryToEdit, setInjuryToEdit] = useState<Injury | null>(null);

  const allInjuries = getInjuriesByAthleteId(athleteId);

  // Mock additional injuries for demo
  const injuries: Injury[] = [
    ...allInjuries.map(inj => ({
      ...inj,
      recoveryStatus: inj.recoveryStatus as 'active' | 'recovering' | 'recovered' | 'chronic',
      severity: inj.severity as 'low' | 'medium' | 'high' | 'critical'
    })),
    {
      id: 'injury-2',
      athleteId,
      injuryDate: '2024-02-15',
      injuryType: 'overuse',
      bodyPart: 'Right Shoulder',
      severity: 'low',
      description: 'Dor leve no ombro direito durante overhead movements',
      expectedRecoveryDays: 7,
      recoveryStatus: 'recovering',
      affectsTraining: true,
      loadModificationPercentage: 70
    },
    {
      id: 'injury-3',
      athleteId,
      injuryDate: '2023-12-20',
      injuryType: 'sprain',
      bodyPart: 'Left Ankle',
      severity: 'medium',
      description: 'Entorse do tornozelo durante box jumps',
      expectedRecoveryDays: 21,
      actualRecoveryDays: 18,
      recoveryStatus: 'recovered',
      affectsTraining: false
    }
  ];

  // ✅ NEW DAY 6: Handle injury creation
  const handleCreateInjury = async (data: InjuryFormData) => {
    // TODO: Replace with actual API call
    // console.log removed to prevent PII leak (LGPD/GDPR)
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // ✅ NEW DAY 6: Handle injury edit
  const handleEditInjury = async (data: InjuryFormData) => {
    // TODO: Replace with actual API call
    // console.log removed to prevent PII leak (LGPD/GDPR)
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // ✅ NEW DAY 6: Handle injury delete
  const handleDeleteInjury = async (injuryId: string) => {
    toast.success('🗑️ Lesão eliminada!', {
      description: 'O registo foi removido com sucesso.'
    });
  };

  // ✅ NEW DAY 6: Handle status update
  const handleUpdateStatus = async (injuryId: string, status: string) => {
    toast.success('✅ Estado atualizado!', {
      description: `Lesão marcada como ${status}.`
    });
  };

  // ✅ NEW DAY 6: Handle injury click
  const handleInjuryClick = (injury: any) => {
    const fullInjury: Injury = {
      ...injury,
      severity: injury.severity as 'low' | 'medium' | 'high' | 'critical',
      recoveryStatus: injury.recoveryStatus as 'active' | 'recovering' | 'recovered' | 'chronic'
    };
    setSelectedInjury(fullInjury);
  };

  // ✅ NEW DAY 6: Get athlete name (mock)
  const athleteName = 'João Silva'; // TODO: Get from athlete data

  // Filter injuries
  const filteredInjuries = injuries.filter(injury => {
    if (activeFilter === 'all') return true;
    return injury.recoveryStatus === activeFilter;
  });

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'low':
        return {
          label: 'Leve',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200'
        };
      case 'medium':
        return {
          label: 'Média',
          color: 'bg-amber-500',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'high':
        return {
          label: 'Alta',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'critical':
        return {
          label: 'Crítica',
          color: 'bg-purple-500',
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          label: 'Desconhecida',
          color: 'bg-slate-500',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativa',
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'recovering':
        return {
          label: 'Recuperando',
          icon: Clock,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'recovered':
        return {
          label: 'Recuperada',
          icon: CheckCircle,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200'
        };
      case 'chronic':
        return {
          label: 'Crónica',
          icon: Activity,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          label: 'Desconhecido',
          icon: AlertCircle,
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200'
        };
    }
  };

  const calculateRecoveryProgress = (injury: any) => {
    if (!injury.expectedRecoveryDays) return 0;
    
    const startDate = new Date(injury.injuryDate);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress = Math.min((daysPassed / injury.expectedRecoveryDays) * 100, 100);
    
    return Math.round(progress);
  };

  // Stats
  const stats = {
    total: injuries.length,
    active: injuries.filter(i => i.recoveryStatus === 'active').length,
    recovering: injuries.filter(i => i.recoveryStatus === 'recovering').length,
    recovered: injuries.filter(i => i.recoveryStatus === 'recovered').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50/90 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-sky-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-red-50/90 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Ativas
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{stats.active}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/90 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Recuperando
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{stats.recovering}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/90 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Recuperadas
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{stats.recovered}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['all', 'active', 'recovering', 'recovered'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            const labels = {
              all: 'Todas',
              active: 'Ativas',
              recovering: 'Recuperando',
              recovered: 'Recuperadas'
            };

            return (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/30'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-300'
                }`}
              >
                {labels[filter]}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30 text-sm font-semibold whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Registar
        </motion.button>
      </motion.div>

      {/* Injuries List */}
      {filteredInjuries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center"
        >
          <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 mb-2">Nenhuma lesão encontrada</h3>
          <p className="text-sm text-slate-600">
            {activeFilter === 'all' 
              ? 'Atleta sem histórico de lesões' 
              : `Sem lesões no estado: ${activeFilter}`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredInjuries.map((injury, index) => {
            const severityConfig = getSeverityConfig(injury.severity);
            const statusConfig = getStatusConfig(injury.recoveryStatus);
            const StatusIcon = statusConfig.icon;
            const recoveryProgress = calculateRecoveryProgress(injury);

            return (
              <motion.button
                key={injury.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                onClick={() => handleInjuryClick(injury)}
                className={`w-full text-left rounded-2xl border ${statusConfig.borderColor} bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`h-12 w-12 rounded-xl ${statusConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-slate-900">
                            {injury.bodyPart}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md ${severityConfig.bgColor} ${severityConfig.textColor} text-xs font-bold`}>
                            {severityConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md ${statusConfig.bgColor} ${statusConfig.color} text-xs font-bold`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {injury.injuryType} • {injury.description}
                        </p>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Lesão: {formatDate(injury.injuryDate)}</span>
                      </div>
                      {injury.expectedRecoveryDays && (
                        <>
                          <span>•</span>
                          <span>Previsto: {injury.expectedRecoveryDays} dias</span>
                        </>
                      )}
                      {injury.actualRecoveryDays && (
                        <>
                          <span>•</span>
                          <span>Real: {injury.actualRecoveryDays} dias</span>
                        </>
                      )}
                    </div>

                    {/* Recovery Progress */}
                    {injury.recoveryStatus !== 'recovered' && injury.expectedRecoveryDays && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>Progresso de Recuperação</span>
                          <span className="font-bold">{recoveryProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${recoveryProgress}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                            className={`h-full rounded-full ${
                              recoveryProgress >= 80 ? 'bg-emerald-500' :
                              recoveryProgress >= 50 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Training Impact */}
                    {injury.affectsTraining && (
                      <div className={`p-3 rounded-xl ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className={`h-4 w-4 ${statusConfig.color}`} />
                          <span className={`text-xs font-bold ${statusConfig.color}`}>
                            Impacto no Treino
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">
                          {injury.loadModificationPercentage 
                            ? `Carga reduzida para ${injury.loadModificationPercentage}%`
                            : 'Requer modificações no treino'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
      <CreateInjuryModal
        isOpen={isCreateModalOpen || !!injuryToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInjuryToEdit(null);
        }}
        athleteId={athleteId}
        athleteName={athleteName}
        injury={injuryToEdit}
        onSave={injuryToEdit ? handleEditInjury : handleCreateInjury}
      />
      <InjuryDetailsDrawer
        isOpen={!!selectedInjury}
        onClose={() => setSelectedInjury(null)}
        injury={selectedInjury!}
        onDelete={handleDeleteInjury}
        onUpdateStatus={handleUpdateStatus}
        onEdit={(injury) => {
          setInjuryToEdit(injury);
          setSelectedInjury(null);
        }}
      />
    </div>
  );
}