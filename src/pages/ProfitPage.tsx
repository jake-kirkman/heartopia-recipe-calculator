import { useState, useMemo } from 'react';
import { recipes } from '../data/recipes';
import type { StarRating as StarRatingType, Recipe } from '../data/types';
import { getSellPrice, getProfit, getMargin, computeCostToMake } from '../utils/calculations';
import { formatGold, formatPercent, categoryLabel } from '../utils/formatters';
import { StarRating } from '../components/StarRating';
import { Badge, TbdBadge } from '../components/Badge';
import { RecipeModal } from '../components/RecipeModal';
import { useBatchPlanner } from '../context/BatchPlannerContext';

type SortField = 'name' | 'level' | 'cost' | 'sell' | 'profit' | 'margin';
type SortDir = 'asc' | 'desc';

interface ComputedRecipe {
  recipe: Recipe;
  sell: number | null;
  profit: number | null;
  margin: number | null;
}

function profitColorClass(profit: number | null): string {
  if (profit === null) return 'text-gray-400';
  if (profit > 5000) return 'text-green-600';
  if (profit > 1000) return 'text-green-500';
  if (profit > 0) return 'text-sage';
  if (profit === 0) return 'text-gray-400';
  return 'text-red-500';
}

function getAllLevels(): number[] {
  const levels = new Set(recipes.map((r) => r.level));
  return Array.from(levels).sort((a, b) => a - b);
}

function getAllCategories(): string[] {
  const cats = new Set(
    recipes.filter((r) => r.category !== 'failure').map((r) => r.category)
  );
  return Array.from(cats).sort();
}

const SORT_LABELS: Record<SortField, string> = {
  name: 'Name',
  level: 'Level',
  cost: 'Cost',
  sell: 'Sell Price',
  profit: 'Profit',
  margin: 'Margin %',
};

function SortArrow({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) {
    return <span className="text-wood/30 ml-1">&uarr;&darr;</span>;
  }
  return (
    <span className="text-coral ml-1">
      {sortDir === 'asc' ? '\u2191' : '\u2193'}
    </span>
  );
}

export function ProfitPage() {
  const { items, addItem, decrementItem } = useBatchPlanner();
  const [star, setStar] = useState<StarRatingType>(3);
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('profit');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const levels = useMemo(() => getAllLevels(), []);
  const categories = useMemo(() => getAllCategories(), []);

  const computed = useMemo<ComputedRecipe[]>(() => {
    return recipes
      .filter((r) => r.category !== 'failure')
      .filter((r) => levelFilter === 'all' || r.level === levelFilter)
      .filter((r) => categoryFilter === 'all' || r.category === categoryFilter)
      .map((recipe) => ({
        recipe,
        sell: getSellPrice(recipe, star),
        profit: getProfit(recipe, star),
        margin: getMargin(recipe, star),
      }));
  }, [star, levelFilter, categoryFilter]);

  const sorted = useMemo(() => {
    const copy = [...computed];

    copy.sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortField) {
        case 'name':
          aVal = a.recipe.name.toLowerCase();
          bVal = b.recipe.name.toLowerCase();
          break;
        case 'level':
          aVal = a.recipe.level;
          bVal = b.recipe.level;
          break;
        case 'cost':
          aVal = computeCostToMake(a.recipe);
          bVal = computeCostToMake(b.recipe);
          break;
        case 'sell':
          aVal = a.sell;
          bVal = b.sell;
          break;
        case 'profit':
          aVal = a.profit;
          bVal = b.profit;
          break;
        case 'margin':
          aVal = a.margin;
          bVal = b.margin;
          break;
        default:
          aVal = null;
          bVal = null;
      }

      // Null values always go to the bottom regardless of sort direction
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      let cmp: number;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal);
      } else {
        cmp = (aVal as number) - (bVal as number);
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return copy;
  }, [computed, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  }

  function renderProfitCell(profit: number | null) {
    if (profit === null) return <TbdBadge />;
    const sign = profit >= 0 ? '+' : '';
    return (
      <span className={`font-semibold ${profitColorClass(profit)}`}>
        {sign}{profit.toLocaleString()}G
      </span>
    );
  }

  function renderMarginCell(margin: number | null) {
    if (margin === null) return <TbdBadge />;
    return (
      <span className={`font-semibold ${profitColorClass(margin > 50 ? 5001 : margin > 20 ? 1001 : margin > 0 ? 1 : margin === 0 ? 0 : -1)}`}>
        {formatPercent(margin)}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-bark mb-1">Profit Calculator</h1>
        <p className="text-wood">
          Compare recipe profits and margins across all star ratings.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="rounded-xl bg-white shadow-sm border border-peach/30 p-4 space-y-4">
        {/* Star Rating Row */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold text-bark whitespace-nowrap">
            Star Rating:
          </label>
          <StarRating value={star} onChange={setStar} size="lg" />
          <span className="text-sm text-wood">
            Showing {star}-star sell prices
          </span>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="level-filter" className="text-sm font-semibold text-bark">
              Level:
            </label>
            <select
              id="level-filter"
              value={levelFilter}
              onChange={(e) =>
                setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="rounded-lg border border-peach/50 bg-cream/50 px-3 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-coral/40"
            >
              <option value="all">All Levels</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  Level {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="category-filter" className="text-sm font-semibold text-bark">
              Category:
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-peach/50 bg-cream/50 px-3 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-coral/40"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-wood">
            {sorted.length} recipe{sorted.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl bg-white shadow-sm border border-peach/30 overflow-clip">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {(
                  [
                    ['name', 'Recipe'],
                    ['level', 'Lvl'],
                    ['cost', 'Cost'],
                    ['sell', 'Sell Price'],
                    ['profit', 'Profit'],
                    ['margin', 'Margin %'],
                  ] as [SortField, string][]
                ).map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`px-4 py-3 text-left font-semibold text-bark cursor-pointer select-none hover:bg-peach/50 transition-colors sticky top-[57px] z-20 bg-cream border-b border-peach/30 ${
                      field !== 'name' ? 'text-right' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {label}
                      <SortArrow field={field} sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-wood">
                    No recipes match your filters.
                  </td>
                </tr>
              )}
              {sorted.map((item, idx) => (
                <tr
                  key={item.recipe.id}
                  onClick={() => setSelectedRecipe(item.recipe)}
                  className={`border-t border-peach/20 hover:bg-peach/10 transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-cream/50'
                  }`}
                >
                  {/* Recipe Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-bark">
                        {item.recipe.name}
                      </span>
                      <Badge variant={item.recipe.isTbd ? 'gray' : 'peach'}>
                        {categoryLabel(item.recipe.category)}
                      </Badge>
                      {item.recipe.isComposite && (
                        <Badge variant="sky">Composite</Badge>
                      )}
                    </div>
                  </td>

                  {/* Level */}
                  <td className="px-4 py-3 text-right text-bark tabular-nums">
                    {item.recipe.level}
                  </td>

                  {/* Cost */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {computeCostToMake(item.recipe) === null ? (
                      <TbdBadge />
                    ) : (
                      <span className="text-bark">
                        {formatGold(computeCostToMake(item.recipe))}
                      </span>
                    )}
                  </td>

                  {/* Sell Price */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.sell === null ? (
                      <TbdBadge />
                    ) : (
                      <span className="text-bark font-medium">
                        {formatGold(item.sell)}
                      </span>
                    )}
                  </td>

                  {/* Profit */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {renderProfitCell(item.profit)}
                  </td>

                  {/* Margin */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {renderMarginCell(item.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sorted.length === 0 && (
          <div className="rounded-xl bg-white shadow-sm border border-peach/30 p-6 text-center text-wood">
            No recipes match your filters.
          </div>
        )}
        {sorted.map((item) => (
          <div
            key={item.recipe.id}
            onClick={() => setSelectedRecipe(item.recipe)}
            className="rounded-xl bg-white shadow-sm border border-peach/30 p-4 space-y-3 cursor-pointer hover:bg-peach/10 transition-colors"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-bark leading-tight">
                  {item.recipe.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant={item.recipe.isTbd ? 'gray' : 'peach'}>
                    {categoryLabel(item.recipe.category)}
                  </Badge>
                  {item.recipe.isComposite && (
                    <Badge variant="sky">Composite</Badge>
                  )}
                </div>
              </div>
              <span className="text-sm text-wood whitespace-nowrap">
                Lv {item.recipe.level}
              </span>
            </div>

            {/* Card Stats Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-wood">Cost</span>
                <span className="text-bark tabular-nums">
                  {computeCostToMake(item.recipe) === null ? (
                    <TbdBadge />
                  ) : (
                    formatGold(computeCostToMake(item.recipe))
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-wood">Sell</span>
                <span className="text-bark font-medium tabular-nums">
                  {item.sell === null ? <TbdBadge /> : formatGold(item.sell)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-wood">Profit</span>
                {renderProfitCell(item.profit)}
              </div>
              <div className="flex justify-between">
                <span className="text-wood">Margin</span>
                {renderMarginCell(item.margin)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sort Controls for Mobile */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-10">
        <div className="rounded-xl bg-white shadow-lg border border-peach/30 px-4 py-3 flex items-center gap-3">
          <label htmlFor="mobile-sort" className="text-sm font-semibold text-bark whitespace-nowrap">
            Sort:
          </label>
          <select
            id="mobile-sort"
            value={sortField}
            onChange={(e) => {
              const field = e.target.value as SortField;
              setSortField(field);
              setSortDir(field === 'name' ? 'asc' : 'desc');
            }}
            className="flex-1 rounded-lg border border-peach/50 bg-cream/50 px-3 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-coral/40"
          >
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="rounded-lg border border-peach/50 bg-cream/50 px-3 py-1.5 text-sm text-bark hover:bg-peach/30 transition-colors"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? '\u2191 Asc' : '\u2193 Desc'}
          </button>
        </div>
      </div>

      {/* Detail modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          star={star}
          onClose={() => setSelectedRecipe(null)}
          onIncrement={() => addItem(selectedRecipe.id, 1, star)}
          onDecrement={() => decrementItem(selectedRecipe.id, star)}
          plannerQuantity={items.find(i => i.recipeId === selectedRecipe.id && i.starRating === star)?.quantity ?? 0}
        />
      )}
    </div>
  );
}
