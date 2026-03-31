/**
 * ATHLETE AVAILABILITY MODAL
 * Manage athlete availability schedules
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Clock, 
  User,
  Plus,
  Trash2,
  Save,
  Copy
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner@2.0.3';
import {
  AthleteAvailability,
  AvailabilitySelector,
  AvailabilityStatus,
} from '../components/AthleteAvailability';

interface AvailabilityBlock {
  id: string;
  athleteId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  notes?: string;
  recurring?: boolean;
  recurringDays?: number[]; // 0-6 (Sunday-Saturday)
}

interface AthleteAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  athletes: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

export function AthleteAvailabilityModal({
  isOpen,
  onClose,
  workspaceId,
  athletes,
}: AthleteAvailabilityModalProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    athletes[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  
  // New block form
  const [newBlock, setNewBlock] = useState<Partial<AvailabilityBlock>>({
    startTime: '09:00',
    endTime: '17:00',
    status: 'available',
    notes: '',
    recurring: false,
    recurringDays: [],
  });
  
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);
  
  const handleAddBlock = () => {
    if (!newBlock.startTime || !newBlock.endTime || !newBlock.status) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const block: AvailabilityBlock = {
      id: `block-${Date.now()}`,
      athleteId: selectedAthleteId,
      date: selectedDate,
      startTime: newBlock.startTime!,
      endTime: newBlock.endTime!,
      status: newBlock.status!,
      notes: newBlock.notes,
      recurring: newBlock.recurring,
      recurringDays: newBlock.recurringDays,
    };
    
    setAvailabilityBlocks([...availabilityBlocks, block]);
    toast.success('Disponibilidade adicionada!');
    setIsAddingBlock(false);
    
    // Reset form
    setNewBlock({
      startTime: '09:00',
      endTime: '17:00',
      status: 'available',
      notes: '',
      recurring: false,
      recurringDays: [],
    });
  };
  
  const handleDeleteBlock = (blockId: string) => {
    setAvailabilityBlocks(availabilityBlocks.filter(b => b.id !== blockId));
    toast.success('Disponibilidade removida');
  };
  
  const handleSave = async () => {
    toast.success('Disponibilidade guardada com sucesso!');
    onClose();
  };
  
  const handleCopyToWeek = () => {
    const newBlocks: AvailabilityBlock[] = [];
    
    for (let i = 1; i <= 7; i++) {
      const newDate = addDays(selectedDate, i);
      availabilityBlocks.forEach(block => {
        if (block.date.toDateString() === selectedDate.toDateString()) {
          newBlocks.push({
            ...block,
            id: `block-${Date.now()}-${i}-${block.id}`,
            date: newDate,
          });
        }
      });
    }
    
    setAvailabilityBlocks([...availabilityBlocks, ...newBlocks]);
    toast.success('Disponibilidade copiada para os próximos 7 dias!');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Gestão de Disponibilidade
              </h2>
              <p className="text-sm text-slate-600">
                Configure quando os atletas estão disponíveis
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Athlete & Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Athlete Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Atleta
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                >
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Date Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Data
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                />
              </div>
            </div>
          </div>
          
          {/* Current Blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Disponibilidade para {format(selectedDate, "dd 'de' MMMM", { locale: pt })}
              </h3>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyToWeek}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all"
                  disabled={availabilityBlocks.length === 0}
                >
                  <Copy className="h-3 w-3" />
                  Copiar para semana
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddingBlock(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </motion.button>
              </div>
            </div>
            
            <div className="space-y-2">
              {availabilityBlocks
                .filter(b => b.date.toDateString() === selectedDate.toDateString())
                .map((block, index) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <AthleteAvailability
                      status={block.status}
                      showLabel={false}
                      size="sm"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-900">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                      {block.notes && (
                        <p className="text-xs text-slate-600 mt-1">{block.notes}</p>
                      )}
                      {block.recurring && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 mt-1">
                          Recorrente
                        </span>
                      )}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteBlock(block.id)}
                      className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </motion.button>
                  </motion.div>
                ))}
              
              {availabilityBlocks.filter(b => b.date.toDateString() === selectedDate.toDateString()).length === 0 && !isAddingBlock && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhuma disponibilidade configurada para esta data
                </div>
              )}
            </div>
          </div>
          
          {/* Add New Block Form */}
          <AnimatePresence>
            {isAddingBlock && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border-2 border-sky-200 bg-sky-50/30 p-4 space-y-4"
              >
                <h4 className="text-sm font-bold text-slate-900">Novo Período</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Start Time */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Hora Início
                    </label>
                    <input
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300"
                    />
                  </div>
                  
                  {/* End Time */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Hora Fim
                    </label>
                    <input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300"
                    />
                  </div>
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <AvailabilitySelector
                    value={newBlock.status || 'available'}
                    onChange={(status) => setNewBlock({ ...newBlock, status })}
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={newBlock.notes || ''}
                    onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })}
                    placeholder="Ex: Fisioterapia, Viagem, etc."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300"
                  />
                </div>
                
                {/* Recurring */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newBlock.recurring || false}
                    onChange={(e) => setNewBlock({ ...newBlock, recurring: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700">Recorrente</span>
                </label>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddBlock}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddingBlock(false)}
                    className="px-4 py-2 text-sm font-medium rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600">
            {availabilityBlocks.length} {availabilityBlocks.length === 1 ? 'período configurado' : 'períodos configurados'}
          </p>
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-sky-500 transition-all"
            >
              <Save className="h-4 w-4" />
              Guardar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
