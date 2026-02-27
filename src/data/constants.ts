import type { StarRating, StarOdds } from './types';

export const STAR_MULTIPLIERS: Record<StarRating, number> = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 4,
  5: 8,
};

export const DEFAULT_DAILY_LIMIT = 50;

export const RECIPE_COSTS_BY_LEVEL: Record<number, number | null> = {
  1: 200,
  2: 200,
  3: 800,
  4: 800,
  5: 1600,
  6: 1600,
  7: 3200,
  8: 3200,
  9: 6400,
  10: null,
  11: null,
  12: null,
  13: null,
};

export const STAR_LABELS: Record<StarRating, string> = {
  1: '1 Star',
  2: '2 Star',
  3: '3 Star',
  4: '4 Star',
  5: '5 Star',
};

// ─── Garden Plot Presets ────────────────────────────────────────────

import type { GardenLevelPreset } from './types';

export const GARDEN_LEVEL_PRESETS: GardenLevelPreset[] = [
  { level: 1, plots: 9, label: 'Lv 1 (9 plots)' },
  { level: 4, plots: 20, label: 'Lv 4 (20 plots)' },
  { level: 7, plots: 30, label: 'Lv 7 (30 plots)' },
  { level: 10, plots: 40, label: 'Lv 10 (40 plots)' },
];

export const DEFAULT_GARDEN_PLOTS = 9;

export const DEFAULT_STAR_ODDS: StarOdds = { 1: 80, 2: 10, 3: 5, 4: 3, 5: 2 };
