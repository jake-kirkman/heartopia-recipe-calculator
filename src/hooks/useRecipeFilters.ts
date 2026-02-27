import { useState, useMemo } from 'react';
import type { Recipe, StarRating as StarRatingType, RecipeCategory } from '../data/types';
import { SORT_OPTIONS } from '../data/recipeConstants';
import { getSellPrice, getProfit } from '../utils/calculations';

export interface UseRecipeFiltersOptions {
  recipes: Recipe[];
  star: StarRatingType;
  sortOptions?: { value: string; label: string }[];
  customSort?: (sortKey: string, a: Recipe, b: Recipe) => number | undefined;
}

export function useRecipeFilters({ recipes, star, sortOptions, customSort }: UseRecipeFiltersOptions) {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | 'all'>('all');
  const [showTbd, setShowTbd] = useState(true);
  const [sortKey, setSortKey] = useState<string>('name');

  const effectiveSortOptions = sortOptions ?? SORT_OPTIONS;

  const filtered = useMemo(() => {
    let list = recipes;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }

    if (levelFilter !== 'all') {
      list = list.filter((r) => r.level === levelFilter);
    }

    if (categoryFilter !== 'all') {
      list = list.filter((r) => r.category === categoryFilter);
    }

    if (!showTbd) {
      list = list.filter((r) => !r.isTbd);
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      // Try custom sort first
      if (customSort) {
        const result = customSort(sortKey, a, b);
        if (result !== undefined) return result;
      }

      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return a.level - b.level || a.name.localeCompare(b.name);
        case 'sell-high': {
          const sa = getSellPrice(a, star) ?? -1;
          const sb = getSellPrice(b, star) ?? -1;
          return sb - sa;
        }
        case 'sell-low': {
          const sa = getSellPrice(a, star) ?? Infinity;
          const sb = getSellPrice(b, star) ?? Infinity;
          return sa - sb;
        }
        case 'profit-high': {
          const pa = getProfit(a, star) ?? -Infinity;
          const pb = getProfit(b, star) ?? -Infinity;
          return pb - pa;
        }
        case 'profit-low': {
          const pa = getProfit(a, star) ?? Infinity;
          const pb = getProfit(b, star) ?? Infinity;
          return pa - pb;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [recipes, search, levelFilter, categoryFilter, showTbd, sortKey, star, customSort]);

  return {
    filtered,
    search,
    setSearch,
    levelFilter,
    setLevelFilter,
    categoryFilter,
    setCategoryFilter,
    showTbd,
    setShowTbd,
    sortKey,
    setSortKey,
    effectiveSortOptions,
  };
}
