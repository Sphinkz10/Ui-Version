/**
 * ANALYTICS DASHBOARD
 * Comprehensive analytics and insights for calendar events
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CalendarEvent } from '@/types/calendar';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';

interface AnalyticsDashboardProps {
  events: CalendarEvent[];
  dateRange: {
    start: Date;
    end: Date;
  };
  athletes?: Array<{ id: string; name: string; avatar?: string }>;
}

export function AnalyticsDashboard({ events, dateRange, athletes = [] }: AnalyticsDashboardProps) {
  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalEvents = events.length;
    
    // Calculate attendance rate (mock - would come from real data)
    const confirmedParticipants = events.reduce((sum, event) => {
      return sum + (event.participants?.filter(p => p.status === 'confirmed').length || 0);
    }, 0);
    const totalParticipants = events.reduce((sum, event) => {
      return sum + (event.participants?.length || 0);
    }, 0);
    const attendanceRate = totalParticipants > 0 
      ? Math.round((confirmedParticipants / totalParticipants) * 100)
      : 0;
    
    // Calculate average duration
    const totalDuration = events.reduce((sum, event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return sum + (end.getTime() - start.getTime());
    }, 0);
    const avgDuration = totalEvents > 0 
      ? Math.round(totalDuration / totalEvents / 1000 / 60) // minutes
      : 0;
    
    // Count conflicts (mock - would come from conflict detection)
    const conflicts = 0; // Would be calculated from real conflict detection
    
    return {
      totalEvents,
      attendanceRate,
      avgDuration,
      conflicts,
    };
  }, [events]);
  
  // Prepare daily events chart data
  const dailyEventsData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map(day => {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      return {
        date: format(day, 'EEE', { locale: pt }),
        eventos: dayEvents.length,
        participantes: dayEvents.reduce((sum, e) => sum + (e.participants?.length || 0), 0),
      };
    });
  }, [events, dateRange]);
  
  // Prepare event types distribution
  const eventTypesData = useMemo(() => {
    const types: Record<string, number> = {};
    
    events.forEach(event => {
      const type = event.type || 'Outro';
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.entries(types).map(([name, value]) => ({
      name,
      value,
    }));
  }, [events]);
  
  // Colors for pie chart
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];
  
  // Export to PDF (mock)
  const handleExportPDF = () => {};
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-sm text-slate-600 mt-1">
            {format(dateRange.start, "d 'de' MMM", { locale: pt })} - {format(dateRange.end, "d 'de' MMM yyyy", { locale: pt })}
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:border-sky-300 transition-all"
        >
          <Download className="h-4 w-4" />
          Exportar PDF
        </motion.button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50/90 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-medium text-slate-500">Total Eventos</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{kpis.totalEvents}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            <p className="text-xs text-emerald-600 font-medium">+12% vs semana anterior</p>
          </div>
        </motion.div>
        
        {/* Attendance Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-emerald-50/90 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-medium text-slate-500">Taxa de Presença</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{kpis.attendanceRate}%</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            <p className="text-xs text-emerald-600 font-medium">+5% vs semana anterior</p>
          </div>
        </motion.div>
        
        {/* Average Duration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-amber-50/90 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-medium text-slate-500">Duração Média</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{kpis.avgDuration}min</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <p className="text-xs text-red-600 font-medium">-3min vs semana anterior</p>
          </div>
        </motion.div>
        
        {/* Conflicts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-red-50/30 to-white/90 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-medium text-slate-500">Conflitos</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{kpis.conflicts}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">✅ Tudo resolvido</p>
        </motion.div>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Events Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900">Eventos por Dia</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyEventsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                stroke="#64748b"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  fontSize: '12px' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar 
                dataKey="eventos" 
                fill="#0ea5e9" 
                name="Eventos"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="participantes" 
                fill="#10b981" 
                name="Participantes"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        
        {/* Event Types Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Distribuição por Tipo</h3>
          </div>
          
          {eventTypesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px', 
                    fontSize: '12px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
              Sem dados para mostrar
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Weekly Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-violet-600" />
          <h3 className="text-lg font-bold text-slate-900">Tendência Semanal</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyEventsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              stroke="#64748b"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              stroke="#64748b"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                fontSize: '12px' 
              }} 
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line 
              type="monotone" 
              dataKey="eventos" 
              stroke="#0ea5e9" 
              strokeWidth={3}
              name="Eventos"
              dot={{ fill: '#0ea5e9', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="participantes" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Participantes"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
      
      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/95 to-white/95 p-6 shadow-sm"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-4">💡 Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <p className="text-2xl font-bold text-sky-600 mb-1">
              {Math.max(...dailyEventsData.map(d => d.eventos), 0)}
            </p>
            <p className="text-sm font-medium text-slate-700">Dia mais ocupado</p>
            <p className="text-xs text-slate-500 mt-1">
              {dailyEventsData.find(d => d.eventos === Math.max(...dailyEventsData.map(d => d.eventos)))?.date || '-'}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <p className="text-2xl font-bold text-emerald-600 mb-1">
              {dailyEventsData.reduce((sum, d) => sum + d.participantes, 0)}
            </p>
            <p className="text-sm font-medium text-slate-700">Total Participantes</p>
            <p className="text-xs text-slate-500 mt-1">
              Esta semana
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <p className="text-2xl font-bold text-violet-600 mb-1">
              {eventTypesData.length}
            </p>
            <p className="text-sm font-medium text-slate-700">Tipos de Eventos</p>
            <p className="text-xs text-slate-500 mt-1">
              Variedade de treinos
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
