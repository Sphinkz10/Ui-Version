import { useEffect, useRef } from "react";

interface UseAutoSaveOptions<T> {
  data: T;
  key: string;
  delay?: number; // milliseconds
  onSave?: (data: T) => void;
}

export function useAutoSave<T>({ data, key, delay = 2000, onSave }: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid saving initial state
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
        onSave?.(data);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay, onSave]);
}

// Load saved data from sessionStorage
export function useLoadSavedData<T>(key: string, defaultValue: T): T {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (error) {
    console.error("Failed to load saved data:", error);
  }
  return defaultValue;
}

// Clear saved data
export function clearSavedData(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear saved data:", error);
  }
}
