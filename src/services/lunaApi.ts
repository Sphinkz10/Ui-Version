// src/services/lunaApi.ts

export const LunaAPI = {
  getAnalytics: () => new Promise<any>(resolve => {
    setTimeout(() => resolve({
      presentAthletes: { count: 8, total: 12, percentage: 66 },
      sessionsToday: { completed: 2, total: 3, percentage: 66 },
      nextSession: { athlete: "Maria Costa", in: "1h 23min" },
      alerts: { total: 5, critical: 2 }
    }), 300);
  }),

  getCalendarEvents: (range: 'today' | 'week') => new Promise<any[]>(resolve => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sessions = [
      { id: 1, title: "Treino de Força", athlete: "João Félix", start: `${todayStr}T08:00:00`, duration: 60, status: "completed", type: "força" },
      { id: 2, title: "Cardio HIIT", athlete: "Maria Costa", start: `${todayStr}T10:30:00`, duration: 45, status: "in-progress", type: "cardio" },
      { id: 3, title: "Treino de Força", athlete: "André Rocha", start: `${todayStr}T12:00:00`, duration: 60, status: "next", type: "força" },
      { id: 4, title: "Mobilidade", athlete: "Catarina Silva", start: `${todayStr}T15:00:00`, duration: 60, status: "upcoming", type: "mobilidade" }
    ];
    if (range === 'week') {
      for (let i = 1; i <= 6; i++) {
        let d = new Date(now); d.setDate(now.getDate() + i);
        let dateStr = d.toISOString().slice(0, 10);
        sessions.push({ id: 10 + i, title: "Treino Funcional", athlete: "Atleta Genérico", start: `${dateStr}T09:00:00`, duration: 50, status: "upcoming", type: "funcional" });
      }
    }
    resolve(sessions);
  }),

  getAlerts: () => new Promise<any[]>(resolve => {
    resolve([
      { id: 1, type: "injury", severity: 7, athlete: "João Félix", description: "Dor lombar reportada", timeAgo: "32 min" },
      { id: 2, type: "wellness", count: 3, description: "formulários wellness pendentes", timeAgo: "desde ontem" }
    ]);
  }),

  getDecisions: () => new Promise<any[]>(resolve => {
    resolve([
      { id: "d1", title: "Ajuste de carga", description: "João Félix: RPE médio > 8 nas últimas 3 sessões. Reduzir carga em 10%." },
      { id: "d2", title: "Aumentar volume", description: "Maria Costa: volume semanal abaixo do alvo. Adicionar 2 séries por exercício." }
    ]);
  }),

  applyDecision: (decisionId: string) => new Promise<any>(resolve => {
    setTimeout(() => resolve({ success: true, message: `Decisão ${decisionId} aplicada` }), 500);
  })
};
