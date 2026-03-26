import { useState, useMemo, useRef, useEffect } from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { StarRating as StarRatingType, Recipe } from '../data/types';
import { useSettings } from '../context/SettingsContext';
import { getSellPrice, getProfit, getMargin, computeCostToMake } from '../utils/calculations';
import { formatGold, formatPercent, categoryLabel } from '../utils/formatters';
import { StarRating } from '../components/StarRating';
import { Badge } from '../components/Badge';

// ─── Recipe Search Dropdown ──────────────────────────────────────

function RecipeSelector({
  label,
  selected,
  onSelect,
  recipes,
}: {
  label: string;
  selected: Recipe | null;
  onSelect: (recipe: Recipe | null) => void;
  recipes: Recipe[];
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return recipes.slice(0, 8);
    const q = query.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, recipes]);

  return (
    <div ref={ref} className="flex-1 min-w-0">
      <label className="text-sm font-semibold text-bark block mb-1">{label}</label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-lg border border-peach/50 bg-cream/50 px-3 py-2">
          <span className="font-medium text-bark truncate">{selected.name}</span>
          <Badge variant="peach">{categoryLabel(selected.category)}</Badge>
          <span className="text-xs text-wood">Lv {selected.level}</span>
          <button
            onClick={() => { onSelect(null); setQuery(''); }}
            className="ml-auto text-wood hover:text-coral transition-colors text-lg leading-none"
            title="Clear"
          >
            &times;
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder="Search recipes..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-lg border border-peach/50 bg-cream/50 px-3 py-2 text-sm text-bark placeholder:text-wood/50 focus:outline-none focus:ring-2 focus:ring-coral/40"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-30 mt-1 w-full rounded-lg border border-peach/30 bg-white shadow-lg max-h-60 overflow-auto">
              {suggestions.map((r) => (
                <li key={r.id}>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-peach/20 transition-colors flex items-center gap-2"
                    onClick={() => { onSelect(r); setOpen(false); setQuery(''); }}
                  >
                    <span className="font-medium text-bark truncate">{r.name}</span>
                    <span className="text-xs text-wood ml-auto whitespace-nowrap">Lv {r.level}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Comparison Helpers ──────────────────────────────────────────

type CompareDir = 'higher' | 'lower' | 'none';

function compareColor(
  a: number | null,
  b: number | null,
  better: CompareDir,
): { aClass: string; bClass: string } {
  if (better === 'none' || a === null || b === null || a === b) {
    return { aClass: '', bClass: '' };
  }
  const aWins = better === 'higher' ? a > b : a < b;
  const bWins = better === 'higher' ? b > a : b < a;
  return {
    aClass: aWins ? 'text-green-600 bg-green-50' : bWins ? 'text-red-500 bg-red-50' : '',
    bClass: bWins ? 'text-green-600 bg-green-50' : aWins ? 'text-red-500 bg-red-50' : '',
  };
}

// ─── Main Page ───────────────────────────────────────────────────

export function ComparePage() {
  useDocumentMeta({
    title: 'Recipe Comparison',
    description: 'Compare two Heartopia recipes side-by-side. See which recipe has better profit, cost, margin, energy, and more with color-coded stats.',
  });

  const { visibleRecipes } = useSettings();
  const [star, setStar] = useState<StarRatingType>(3);
  const [recipeA, setRecipeA] = useState<Recipe | null>(null);
  const [recipeB, setRecipeB] = useState<Recipe | null>(null);

  const available = useMemo(
    () => visibleRecipes.filter((r) => r.category !== 'failure'),
    [visibleRecipes],
  );

  function handleSwap() {
    setRecipeA(recipeB);
    setRecipeB(recipeA);
  }

  // Compute stats for both recipes
  const statsA = useMemo(() => recipeA ? computeStats(recipeA, star) : null, [recipeA, star]);
  const statsB = useMemo(() => recipeB ? computeStats(recipeB, star) : null, [recipeB, star]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-bark mb-1">Recipe Comparison</h1>
        <p className="text-wood">Select two recipes to compare their stats side-by-side.</p>
      </div>

      {/* Controls */}
      <div className="rounded-xl bg-white shadow-sm border border-peach/30 p-4 space-y-4">
        {/* Star Rating */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold text-bark whitespace-nowrap">Star Rating:</label>
          <StarRating value={star} onChange={setStar} size="lg" />
          <span className="text-sm text-wood">Comparing at {star}-star</span>
        </div>

        {/* Recipe Selectors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <RecipeSelector label="Recipe A" selected={recipeA} onSelect={setRecipeA} recipes={available} />
          <button
            onClick={handleSwap}
            className="self-center sm:self-end rounded-lg border border-peach/50 bg-cream/50 px-3 py-2 text-sm text-bark hover:bg-peach/30 transition-colors whitespace-nowrap"
            title="Swap recipes"
          >
            ⇄ Swap
          </button>
          <RecipeSelector label="Recipe B" selected={recipeB} onSelect={setRecipeB} recipes={available} />
        </div>
      </div>

      {/* Comparison Results */}
      {recipeA && recipeB ? (
        <ComparisonTable recipeA={recipeA} recipeB={recipeB} statsA={statsA!} statsB={statsB!} star={star} />
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-peach/30 p-10 text-center text-wood">
          Select two recipes above to see a detailed comparison.
        </div>
      )}
    </div>
  );
}

// ─── Stats computation ───────────────────────────────────────────

interface RecipeStats {
  cost: number | null;
  sell: number | null;
  profit: number | null;
  margin: number | null;
  energy: number | null;
  ingredientCount: number;
  level: number;
  recipeCost: number | null;
}

function computeStats(recipe: Recipe, star: StarRatingType): RecipeStats {
  return {
    cost: computeCostToMake(recipe),
    sell: getSellPrice(recipe, star),
    profit: getProfit(recipe, star),
    margin: getMargin(recipe, star),
    energy: recipe.energy,
    ingredientCount: recipe.ingredients.length,
    level: recipe.level,
    recipeCost: recipe.unlock.recipeCost ?? null,
  };
}

// ─── Comparison Table ────────────────────────────────────────────

interface StatRow {
  label: string;
  aVal: string;
  bVal: string;
  aRaw: number | null;
  bRaw: number | null;
  better: CompareDir;
}

function ComparisonTable({
  recipeA,
  recipeB,
  statsA,
  statsB,
  star,
}: {
  recipeA: Recipe;
  recipeB: Recipe;
  statsA: RecipeStats;
  statsB: RecipeStats;
  star: StarRatingType;
}) {
  const rows: StatRow[] = [
    {
      label: 'Level',
      aVal: String(statsA.level),
      bVal: String(statsB.level),
      aRaw: statsA.level,
      bRaw: statsB.level,
      better: 'lower',
    },
    {
      label: 'Category',
      aVal: categoryLabel(recipeA.category),
      bVal: categoryLabel(recipeB.category),
      aRaw: null,
      bRaw: null,
      better: 'none',
    },
    {
      label: 'Ingredients',
      aVal: String(statsA.ingredientCount),
      bVal: String(statsB.ingredientCount),
      aRaw: statsA.ingredientCount,
      bRaw: statsB.ingredientCount,
      better: 'lower',
    },
    {
      label: 'Cost to Make',
      aVal: formatGold(statsA.cost),
      bVal: formatGold(statsB.cost),
      aRaw: statsA.cost,
      bRaw: statsB.cost,
      better: 'lower',
    },
    {
      label: `Sell Price (${star}★)`,
      aVal: formatGold(statsA.sell),
      bVal: formatGold(statsB.sell),
      aRaw: statsA.sell,
      bRaw: statsB.sell,
      better: 'higher',
    },
    {
      label: `Profit (${star}★)`,
      aVal: statsA.profit !== null ? (statsA.profit >= 0 ? '+' : '') + statsA.profit.toLocaleString() + 'G' : 'TBD',
      bVal: statsB.profit !== null ? (statsB.profit >= 0 ? '+' : '') + statsB.profit.toLocaleString() + 'G' : 'TBD',
      aRaw: statsA.profit,
      bRaw: statsB.profit,
      better: 'higher',
    },
    {
      label: `Margin (${star}★)`,
      aVal: formatPercent(statsA.margin),
      bVal: formatPercent(statsB.margin),
      aRaw: statsA.margin,
      bRaw: statsB.margin,
      better: 'higher',
    },
    {
      label: 'Energy',
      aVal: statsA.energy !== null ? String(statsA.energy) : 'TBD',
      bVal: statsB.energy !== null ? String(statsB.energy) : 'TBD',
      aRaw: statsA.energy,
      bRaw: statsB.energy,
      better: 'higher',
    },
    {
      label: 'Unlock Method',
      aVal: recipeA.unlock.description,
      bVal: recipeB.unlock.description,
      aRaw: null,
      bRaw: null,
      better: 'none',
    },
    {
      label: 'Recipe Cost',
      aVal: statsA.recipeCost !== null ? formatGold(statsA.recipeCost) : 'Free',
      bVal: statsB.recipeCost !== null ? formatGold(statsB.recipeCost) : 'Free',
      aRaw: statsA.recipeCost,
      bRaw: statsB.recipeCost,
      better: 'lower',
    },
    {
      label: 'Composite',
      aVal: recipeA.isComposite ? 'Yes' : 'No',
      bVal: recipeB.isComposite ? 'Yes' : 'No',
      aRaw: null,
      bRaw: null,
      better: 'none',
    },
  ];

  // Count wins
  let aWins = 0;
  let bWins = 0;
  for (const row of rows) {
    if (row.better === 'none' || row.aRaw === null || row.bRaw === null || row.aRaw === row.bRaw) continue;
    const aIsBetter = row.better === 'higher' ? row.aRaw > row.bRaw : row.aRaw < row.bRaw;
    if (aIsBetter) aWins++;
    else bWins++;
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className={`rounded-lg px-3 py-1.5 font-semibold ${aWins > bWins ? 'bg-green-100 text-green-700' : aWins < bWins ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
          {recipeA.name}: {aWins} win{aWins !== 1 ? 's' : ''}
        </span>
        <span className={`rounded-lg px-3 py-1.5 font-semibold ${bWins > aWins ? 'bg-green-100 text-green-700' : bWins < aWins ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
          {recipeB.name}: {bWins} win{bWins !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl bg-white shadow-sm border border-peach/30 overflow-clip">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-peach/30">
              <th className="px-4 py-3 text-right font-semibold text-bark w-[35%]">{recipeA.name}</th>
              <th className="px-4 py-3 text-center font-semibold text-wood w-[30%]">Stat</th>
              <th className="px-4 py-3 text-left font-semibold text-bark w-[35%]">{recipeB.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const { aClass, bClass } = compareColor(row.aRaw, row.bRaw, row.better);
              return (
                <tr
                  key={row.label}
                  className={`border-t border-peach/20 ${idx % 2 === 0 ? 'bg-white' : 'bg-cream/50'}`}
                >
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${aClass} rounded-l-lg`}>
                    {row.aVal}
                  </td>
                  <td className="px-4 py-3 text-center text-wood font-medium">
                    {row.label}
                  </td>
                  <td className={`px-4 py-3 text-left tabular-nums font-medium ${bClass} rounded-r-lg`}>
                    {row.bVal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {rows.map((row) => {
          const { aClass, bClass } = compareColor(row.aRaw, row.bRaw, row.better);
          return (
            <div
              key={row.label}
              className="rounded-xl bg-white shadow-sm border border-peach/30 px-4 py-3"
            >
              <p className="text-xs text-wood font-semibold mb-2 text-center">{row.label}</p>
              <div className="flex items-center justify-between gap-2">
                <div className={`flex-1 text-center rounded-lg px-2 py-1.5 text-sm font-medium ${aClass}`}>
                  <span className="block text-[10px] text-wood/70 mb-0.5">{recipeA.name}</span>
                  {row.aVal}
                </div>
                <span className="text-wood text-xs">vs</span>
                <div className={`flex-1 text-center rounded-lg px-2 py-1.5 text-sm font-medium ${bClass}`}>
                  <span className="block text-[10px] text-wood/70 mb-0.5">{recipeB.name}</span>
                  {row.bVal}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
