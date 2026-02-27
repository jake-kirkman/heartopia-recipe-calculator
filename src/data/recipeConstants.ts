import { recipes } from './recipes';
import type { RecipeCategory } from './types';

export type BadgeVariant = 'coral' | 'sage' | 'sky' | 'mint' | 'peach' | 'wood' | 'gray';

export const categoryColor: Record<RecipeCategory, BadgeVariant> = {
  jam: 'coral',
  sauce: 'coral',
  grilled: 'sage',
  pie: 'sage',
  'roll-cake': 'mint',
  cake: 'mint',
  salad: 'sage',
  seafood: 'sky',
  pasta: 'sky',
  pizza: 'sky',
  beverage: 'wood',
  soup: 'wood',
  composite: 'peach',
  burger: 'wood',
  other: 'wood',
  failure: 'gray',
  'frostspore-event': 'sky',
};

export type SortKey = 'name' | 'level' | 'sell-high' | 'sell-low' | 'profit-high' | 'profit-low';

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: 'Name A\u2013Z' },
  { value: 'level', label: 'Level' },
  { value: 'sell-high', label: 'Sell Price (high)' },
  { value: 'sell-low', label: 'Sell Price (low)' },
  { value: 'profit-high', label: 'Profit (high)' },
  { value: 'profit-low', label: 'Profit (low)' },
];

export const ALL_LEVELS = Array.from(new Set(recipes.map((r) => r.level))).sort((a, b) => a - b);
export const ALL_CATEGORIES = Array.from(new Set(recipes.map((r) => r.category))).sort() as RecipeCategory[];
