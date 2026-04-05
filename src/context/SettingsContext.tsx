import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { recipes } from '../data/recipes';
import type { Recipe } from '../data/types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SettingsContextType {
  frostsporeEnabled: boolean;
  setFrostsporeEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  dreamlightCinematicEnabled: boolean;
  setDreamlightCinematicEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  pleasantGoatEnabled: boolean;
  setPleasantGoatEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  easterEnabled: boolean;
  setEasterEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  /** Recipes filtered by current settings (excludes disabled seasonal recipes) */
  visibleRecipes: Recipe[];
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [frostsporeEnabled, setFrostsporeEnabled] = useLocalStorage<boolean>(
    'heartopia-frostspore-enabled',
    false,
  );

  const [dreamlightCinematicEnabled, setDreamlightCinematicEnabled] = useLocalStorage<boolean>(
    'heartopia-dreamlight-cinematic-enabled',
    false,
  );

  const [pleasantGoatEnabled, setPleasantGoatEnabled] = useLocalStorage<boolean>(
    'heartopia-pleasant-goat-enabled',
    false,
  );

  const [easterEnabled, setEasterEnabled] = useLocalStorage<boolean>(
    'heartopia-easter-enabled',
    false,
  );

  const visibleRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (r.category === 'frostspore-event' && !frostsporeEnabled) return false;
      if (r.category === 'dreamlight-cinematic' && !dreamlightCinematicEnabled) return false;
      if (r.category === 'pleasant-goat-event' && !pleasantGoatEnabled) return false;
      if (r.category === 'easter-event' && !easterEnabled) return false;
      return true;
    });
  }, [frostsporeEnabled, dreamlightCinematicEnabled, pleasantGoatEnabled, easterEnabled]);

  return (
    <SettingsContext.Provider value={{ frostsporeEnabled, setFrostsporeEnabled, dreamlightCinematicEnabled, setDreamlightCinematicEnabled, pleasantGoatEnabled, setPleasantGoatEnabled, easterEnabled, setEasterEnabled, visibleRecipes }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
