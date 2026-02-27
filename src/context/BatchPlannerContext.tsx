import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { BatchItem, StarRating } from '../data/types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface BatchPlannerContextType {
  items: BatchItem[];
  addItem: (recipeId: string, quantity?: number, starRating?: StarRating) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, updates: Partial<BatchItem>) => void;
  clearItems: () => void;
}

const BatchPlannerContext = createContext<BatchPlannerContextType | null>(null);

export function BatchPlannerProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<BatchItem[]>('heartopia-batch', []);

  const addItem = useCallback((recipeId: string, quantity = 1, starRating: StarRating = 1) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.recipeId === recipeId && i.starRating === starRating);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + quantity };
        return updated;
      }
      return [...prev, { recipeId, quantity, starRating }];
    });
  }, [setItems]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, [setItems]);

  const updateItem = useCallback((index: number, updates: Partial<BatchItem>) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, [setItems]);

  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return (
    <BatchPlannerContext.Provider value={{ items, addItem, removeItem, updateItem, clearItems }}>
      {children}
    </BatchPlannerContext.Provider>
  );
}

export function useBatchPlanner() {
  const ctx = useContext(BatchPlannerContext);
  if (!ctx) throw new Error('useBatchPlanner must be used within BatchPlannerProvider');
  return ctx;
}
