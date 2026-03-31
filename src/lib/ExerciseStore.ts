// ExerciseStore.ts - LocalStorage wrapper for Exercise persistence
// Simple CRUD operations for custom exercises

import { Exercise } from './DesignStudioTypes';

const STORAGE_KEY = 'performtrack_exercises';
const VERSION = '1.0';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Load exercises from LocalStorage
 */
function loadFromStorage(): Exercise[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (parsed.version !== VERSION) {
      // Handle migration if needed
      console.warn('ExerciseStore version mismatch, resetting...');
      return [];
    }
    
    return parsed.exercises || [];
  } catch (error) {
    console.error('Failed to load exercises from storage:', error);
    return [];
  }
}

/**
 * Save exercises to LocalStorage
 */
function saveToStorage(exercises: Exercise[]): boolean {
  try {
    const data = {
      version: VERSION,
      exercises,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save exercises to storage:', error);
    return false;
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `ex_${Date.now()}_${crypto.randomUUID()}`;
}

// =============================================================================
// EXERCISE STORE
// =============================================================================

export const ExerciseStore = {
  /**
   * Get all exercises
   */
  getAll(): Exercise[] {
    return loadFromStorage();
  },

  /**
   * Get exercise by ID
   */
  getById(id: string): Exercise | null {
    const exercises = loadFromStorage();
    return exercises.find(ex => ex.id === id) || null;
  },

  /**
   * Add new exercise
   */
  add(data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Exercise {
    const exercises = loadFromStorage();
    
    const newExercise: Exercise = {
      ...data,
      id: generateId(),
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    exercises.push(newExercise);
    saveToStorage(exercises);
    
    return newExercise;
  },

  /**
   * Update existing exercise
   */
  update(id: string, data: Partial<Exercise>): Exercise | null {
    const exercises = loadFromStorage();
    const index = exercises.findIndex(ex => ex.id === id);
    
    if (index === -1) {
      console.error(`Exercise with id ${id} not found`);
      return null;
    }
    
    exercises[index] = {
      ...exercises[index],
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    saveToStorage(exercises);
    return exercises[index];
  },

  /**
   * Delete exercise
   */
  delete(id: string): boolean {
    const exercises = loadFromStorage();
    const filteredExercises = exercises.filter(ex => ex.id !== id);
    
    if (filteredExercises.length === exercises.length) {
      console.error(`Exercise with id ${id} not found`);
      return false;
    }
    
    saveToStorage(filteredExercises);
    return true;
  },

  /**
   * Search exercises by name or tag
   */
  search(query: string): Exercise[] {
    const exercises = loadFromStorage();
    const lowerQuery = query.toLowerCase();
    
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.description?.toLowerCase().includes(lowerQuery) ||
      ex.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      ex.muscleGroups?.some(mg => mg.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * Filter exercises by category
   */
  filterByCategory(category: string): Exercise[] {
    const exercises = loadFromStorage();
    return exercises.filter(ex => ex.category === category);
  },

  /**
   * Filter exercises by muscle group
   */
  filterByMuscleGroup(muscleGroup: string): Exercise[] {
    const exercises = loadFromStorage();
    return exercises.filter(ex => 
      ex.muscleGroups?.includes(muscleGroup)
    );
  },

  /**
   * Filter exercises by equipment
   */
  filterByEquipment(equipment: string): Exercise[] {
    const exercises = loadFromStorage();
    return exercises.filter(ex => 
      ex.equipment?.includes(equipment)
    );
  },

  /**
   * Get exercise count
   */
  count(): number {
    return loadFromStorage().length;
  },

  /**
   * Clear all exercises (use with caution!)
   */
  clear(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear exercises:', error);
      return false;
    }
  },

  /**
   * Duplicate an exercise
   */
  duplicate(id: string): Exercise | null {
    const exercise = this.getById(id);
    if (!exercise) return null;

    const duplicated = this.add({
      ...exercise,
      name: `${exercise.name} (cópia)`,
      variables: exercise.variables,
      category: exercise.category,
      description: exercise.description,
      muscleGroups: exercise.muscleGroups,
      equipment: exercise.equipment,
      tags: exercise.tags
    });

    return duplicated;
  },

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const exercises = loadFromStorage();
    const categories = new Set(['all']);
    exercises.forEach(ex => {
      if (ex.category) categories.add(ex.category);
    });
    return Array.from(categories);
  },

  /**
   * Get stats
   */
  getStats(): { total: number; custom: number; preset: number; categories: number } {
    const exercises = loadFromStorage();
    return {
      total: exercises.length,
      custom: exercises.filter(ex => ex.isCustom).length,
      preset: exercises.filter(ex => !ex.isCustom).length,
      categories: new Set(exercises.map(ex => ex.category)).size
    };
  },

  /**
   * Subscribe to changes
   */
  subscribe(callback: () => void): () => void {
    // Simple implementation - in a real app, use proper event system
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback();
      }
    };
    
    window.addEventListener('storage', handler);
    
    // Return unsubscribe function
    return () => window.removeEventListener('storage', handler);
  },

  /**
   * Export exercises as JSON
   */
  export(): string {
    const exercises = loadFromStorage();
    return JSON.stringify({
      version: VERSION,
      exportedAt: new Date().toISOString(),
      count: exercises.length,
      exercises
    }, null, 2);
  },

  /**
   * Import exercises from JSON
   */
  import(jsonData: string): { success: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.exercises || !Array.isArray(data.exercises)) {
        return { success: false, count: 0, error: 'Invalid data format' };
      }
      
      const currentExercises = loadFromStorage();
      const newExercises = [...currentExercises, ...data.exercises];
      
      saveToStorage(newExercises);
      
      return { success: true, count: data.exercises.length };
    } catch (error) {
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
};

// =============================================================================
// HELPER: Check if exercise name exists (for validation)
// =============================================================================

export function exerciseNameExists(name: string, excludeId?: string): boolean {
  const exercises = ExerciseStore.getAll();
  return exercises.some(ex => 
    ex.name.toLowerCase() === name.toLowerCase() && ex.id !== excludeId
  );
}