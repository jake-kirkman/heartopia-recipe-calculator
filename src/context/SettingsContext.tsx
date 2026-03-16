import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { recipes } from '../data/recipes';
import type { Recipe } from '../data/types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SettingsContextType {
  frostsporeEnabled: boolean;
  setFrostsporeEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  /** Recipes filtered by current settings (excludes disabled seasonal recipes) */
  visibleRecipes: Recipe[];
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [frostsporeEnabled, setFrostsporeEnabled] = useLocalStorage<boolean>(
    'heartopia-frostspore-enabled',
    false,
  );

  const visibleRecipes = useMemo(() => {
    if (frostsporeEnabled) return recipes;
    return recipes.filter((r) => r.category !== 'frostspore-event');
  }, [frostsporeEnabled]);

  return (
    <SettingsContext.Provider value={{ frostsporeEnabled, setFrostsporeEnabled, visibleRecipes }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
