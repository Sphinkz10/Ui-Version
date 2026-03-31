import { useState, useEffect, useCallback } from 'react';
import type { ActivePack, PackActivationData } from '@/types/packs';

const STORAGE_KEY = 'performtrack_active_packs';

/**
 * Hook para gerenciar packs ativos
 * Usa localStorage para persistência (mock)
 * Em produção, seria substituído por chamadas Supabase
 */
export function useActivePacks() {
  const [activePacks, setActivePacks] = useState<ActivePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActivePacks(parsed);
      }
    } catch (error) {
      console.error('Error loading active packs from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever activePacks changes
  const saveToStorage = useCallback((packs: ActivePack[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
    } catch (error) {
      console.error('Error saving active packs to localStorage:', error);
    }
  }, []);

  // Check if pack is already active
  const isPackActive = useCallback((packId: string): boolean => {
    return activePacks.some(pack => pack.packId === packId);
  }, [activePacks]);

  // Get active pack by ID
  const getActivePack = useCallback((packId: string): ActivePack | undefined => {
    return activePacks.find(pack => pack.packId === packId);
  }, [activePacks]);

  // Activate a pack
  const activatePack = useCallback((activationData: PackActivationData) => {
    // Prevent duplicate activation
    if (isPackActive(activationData.packId)) {
      console.warn('Pack already active:', activationData.packId);
      return;
    }

    const newPack: ActivePack = {
      packId: activationData.packId,
      packName: activationData.packName,
      packIcon: activationData.packIcon,
      packColor: activationData.packColor,
      category: activationData.category,
      activatedAt: new Date().toISOString(),
      metricsCount: activationData.metricsCreated.length,
      metricIds: activationData.metricsCreated.map(m => m.id),
      hasData: false, // no data yet
      formId: activationData.formCreated?.id,
      reportId: activationData.reportCreated?.id,
      decisionsCount: activationData.decisionsCreated?.length || 0,
    };

    const updated = [...activePacks, newPack];
    setActivePacks(updated);
    saveToStorage(updated);
  }, [activePacks, isPackActive, saveToStorage]);

  // Deactivate a pack
  const deactivatePack = useCallback((packId: string) => {
    const updated = activePacks.filter(pack => pack.packId !== packId);
    setActivePacks(updated);
    saveToStorage(updated);
  }, [activePacks, saveToStorage]);

  // Update pack metrics count (quando métricas são deletadas manualmente)
  const updatePackMetricsCount = useCallback((packId: string, newCount: number) => {
    const updated = activePacks.map(pack => {
      if (pack.packId === packId) {
        return { ...pack, metricsCount: newCount };
      }
      return pack;
    });
    setActivePacks(updated);
    saveToStorage(updated);
  }, [activePacks, saveToStorage]);

  // Update pack data status
  const updatePackDataStatus = useCallback((packId: string, hasData: boolean) => {
    const updated = activePacks.map(pack => {
      if (pack.packId === packId) {
        return { ...pack, hasData };
      }
      return pack;
    });
    setActivePacks(updated);
    saveToStorage(updated);
  }, [activePacks, saveToStorage]);

  // Get all active pack IDs
  const activePackIds = activePacks.map(pack => pack.packId);

  return {
    activePacks,
    activePackIds,
    isLoading,
    isPackActive,
    getActivePack,
    activatePack,
    deactivatePack,
    updatePackMetricsCount,
    updatePackDataStatus,
  };
}
