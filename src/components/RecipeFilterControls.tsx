import type { ReactNode } from 'react';
import type { StarRating as StarRatingType, RecipeCategory } from '../data/types';
import { ALL_LEVELS, ALL_CATEGORIES } from '../data/recipeConstants';
import { categoryLabel } from '../utils/formatters';
import { StarRating } from './StarRating';

interface RecipeFilterControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  levelFilter: number | 'all';
  onLevelFilterChange: (value: number | 'all') => void;
  categoryFilter: RecipeCategory | 'all';
  onCategoryFilterChange: (value: RecipeCategory | 'all') => void;
  sortKey: string;
  onSortKeyChange: (value: string) => void;
  sortOptions: { value: string; label: string }[];
  star: StarRatingType;
  onStarChange: (value: StarRatingType) => void;
  showTbd: boolean;
  onShowTbdChange: (value: boolean) => void;
  filteredCount: number;
  totalCount: number;
  children?: ReactNode;
}

export function RecipeFilterControls({
  search,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortKey,
  onSortKeyChange,
  sortOptions,
  star,
  onStarChange,
  showTbd,
  onShowTbdChange,
  filteredCount,
  totalCount,
  children,
}: RecipeFilterControlsProps) {
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-wood mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by name..."
            className="w-full px-3 py-2 rounded-lg border border-peach/60 bg-white text-bark text-sm focus:outline-none focus:ring-2 focus:ring-coral/40"
          />
        </div>

        {/* Level filter */}
        <div>
          <label className="block text-xs font-medium text-wood mb-1">Level</label>
          <select
            value={levelFilter}
            onChange={(e) => onLevelFilterChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-peach/60 bg-white text-bark text-sm focus:outline-none focus:ring-2 focus:ring-coral/40"
          >
            <option value="all">All</option>
            {ALL_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                Lv {lv}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div>
          <label className="block text-xs font-medium text-wood mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value as RecipeCategory | 'all')}
            className="px-3 py-2 rounded-lg border border-peach/60 bg-white text-bark text-sm focus:outline-none focus:ring-2 focus:ring-coral/40"
          >
            <option value="all">All</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-xs font-medium text-wood mb-1">Sort</label>
          <select
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-peach/60 bg-white text-bark text-sm focus:outline-none focus:ring-2 focus:ring-coral/40"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Star rating */}
        <div>
          <label className="block text-xs font-medium text-wood mb-1">Star Rating</label>
          <StarRating value={star} onChange={onStarChange} size="md" />
        </div>

        {/* Show TBD */}
        <label className="flex items-center gap-2 text-sm text-bark cursor-pointer select-none pb-0.5">
          <input
            type="checkbox"
            checked={showTbd}
            onChange={(e) => onShowTbdChange(e.target.checked)}
            className="rounded border-peach text-coral focus:ring-coral/40"
          />
          Show TBD
        </label>

        {/* Extra controls (e.g. "Craftable only") */}
        {children}
      </div>

      {/* Result count */}
      <p className="text-xs text-wood">
        Showing {filteredCount} of {totalCount} recipes
      </p>
    </>
  );
}
