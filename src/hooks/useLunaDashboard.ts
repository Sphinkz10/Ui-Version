// src/hooks/useLunaDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { LunaAPI } from '../services/lunaApi';

export const useLunaDashboard = (currentView: 'today' | 'week' | 'alerts' | 'decisions') => {
  const [kpiData, setKpiData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega os dados primários da view ativa
  const loadViewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (currentView === 'today' || currentView === 'week') {
        const data = await LunaAPI.getCalendarEvents(currentView);
        // Ordena por hora
        setSessions(data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
        const alertsData = await LunaAPI.getAlerts();
        setAlerts(alertsData);
      } else if (currentView === 'alerts') {
        const data = await LunaAPI.getAlerts();
        setAlerts(data);
      } else if (currentView === 'decisions') {
        const data = await LunaAPI.getDecisions();
        setDecisions(data);
      }
    } catch (err) {
      setError('Erro ao carregar dados da vista.');
    } finally {
      setLoading(false);
    }
  }, [currentView]);

  // Boot inicial e Polling de 60s
  useEffect(() => {
    const boot = async () => {
      try {
        const kpis = await LunaAPI.getAnalytics();
        setKpiData(kpis);
        await loadViewData();
        const initialDecisions = await LunaAPI.getDecisions();
        setDecisions(initialDecisions);
      } catch (err) {
        setError('Erro na inicialização do sistema.');
      }
    };
    
    boot();

    // O teu sistema de Polling IA de 60s
    const pollingInterval = setInterval(async () => {
      const newDecisions = await LunaAPI.getDecisions();
      setDecisions(newDecisions);
      if (currentView === 'decisions') {
        loadViewData();
      }
    }, 60000);

    return () => clearInterval(pollingInterval);
  }, [currentView, loadViewData]);

  // Função para aplicar decisão com refresh automático
  const handleApplyDecision = async (id: string, showToast: (msg: string) => void) => {
    try {
      await LunaAPI.applyDecision(id);
      showToast(`Decisão ${id} aplicada com sucesso`);
      const updatedDecisions = await LunaAPI.getDecisions();
      setDecisions(updatedDecisions);
    } catch (err) {
      showToast('Erro ao aplicar decisão');
    }
  };

  return {
    kpiData,
    sessions,
    alerts,
    decisions,
    loading,
    error,
    handleApplyDecision,
    refreshView: loadViewData
  };
};
