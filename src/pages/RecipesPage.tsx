import { useState, useMemo } from 'react';
import { recipes } from '../data/recipes';
import { ingredients } from '../data/ingredients';
import type { Recipe, StarRating as StarRatingType, RecipeCategory } from '../data/types';
import { getSellPrice, getProfit } from '../utils/calculations';
import { formatGold, formatProfit, categoryLabel } from '../utils/formatters';
import { StarRating } from '../components/StarRating';
import { Badge, TbdBadge } from '../components/Badge';
import { useBatchPlanner } from '../context/BatchPlannerContext';

/* ── Category colour mapping ────────────────────────────────────── */

type BadgeVariant = 'coral' | 'sage' | 'sky' | 'mint' | 'peach' | 'wood' | 'gray';

const categoryColor: Record<RecipeCategory, BadgeVariant> = {
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
};

/* ── Sort helpers ────────────────────────────────────────────────── */

type SortKey = 'name' | 'level' | 'sell-high' | 'sell-low' | 'profit-high' | 'profit-low';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name A\u2013Z' },
  { value: 'level', label: 'Level' },
  { value: 'sell-high', label: 'Sell Price (high)' },
  { value: 'sell-low', label: 'Sell Price (low)' },
  { value: 'profit-high', label: 'Profit (high)' },
  { value: 'profit-low', label: 'Profit (low)' },
];

/* ── Derive unique levels & categories from recipe data ──────── */

const ALL_LEVELS = Array.from(new Set(recipes.map((r) => r.level))).sort((a, b) => a - b);
const ALL_CATEGORIES = Array.from(new Set(recipes.map((r) => r.category))).sort() as RecipeCategory[];

/* ── Brief ingredient summary for the card ───────────────────── */

function ingredientSummary(recipe: Recipe): string {
  if (recipe.ingredients.length === 0) return '\u2014';
  return recipe.ingredients
    .map((ri) => {
      const ing = ingredients[ri.ingredientId];
      const name = ing ? ing.name : ri.ingredientId;
      return `${ri.quantity}x ${name}`;
    })
    .join(', ');
}

/* ── Ingredient unit cost helper ─────────────────────────────── */

function ingredientCost(ingredientId: string): number | null {
  return ingredients[ingredientId]?.cost ?? null;
}

/* ================================================================
   Recipe Card
   ================================================================ */

function RecipeCard({
  recipe,
  star,
  onOpen,
  onAdd,
}: {
  recipe: Recipe;
  star: StarRatingType;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const sell = getSellPrice(recipe, star);
  const profit = getProfit(recipe, star);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-peach/40 p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-coral/40 transition-all"
      onClick={onOpen}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-bark leading-tight">{recipe.name}</h3>
        <button
          title="Add to Planner"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-sage/20 text-bark hover:bg-sage/40 transition-colors text-lg leading-none font-bold"
        >
          +
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="sky">Lv&nbsp;{recipe.level}</Badge>
        <Badge variant={categoryColor[recipe.category]}>{categoryLabel(recipe.category)}</Badge>
        {recipe.isTbd && <TbdBadge />}
      </div>

      {/* Ingredients (brief) */}
      <p className="text-xs text-wood leading-snug line-clamp-2">{ingredientSummary(recipe)}</p>

      {/* Sell / Profit */}
      <div className="mt-auto pt-2 border-t border-peach/30 flex items-center justify-between text-sm">
        <span className="text-bark">
          Sell: <span className="font-semibold">{formatGold(sell)}</span>
        </span>
        <span className={profit !== null && profit >= 0 ? 'text-sage font-semibold' : 'text-coral font-semibold'}>
          {formatProfit(profit)}
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   Expandable Ingredient Row (recursive for recipe-as-ingredient)
   ================================================================ */

function findSubRecipe(ingredientId: string): Recipe | undefined {
  if (!ingredientId.startsWith('recipe-')) return undefined;
  return recipes.find((r) => r.id === ingredientId.slice('recipe-'.length));
}

function IngredientRow({
  ingredientId,
  quantity,
  depth,
  parentMultiplier,
}: {
  ingredientId: string;
  quantity: number;
  depth: number;
  parentMultiplier: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const subRecipe = findSubRecipe(ingredientId);
  const ing = ingredients[ingredientId];
  const name = ing ? ing.name : ingredientId;
  const unit = ingredientCost(ingredientId);
  const effectiveQty = quantity * parentMultiplier;
  const sub = unit !== null ? unit * effectiveQty : null;
  const isExpandable = !!subRecipe && subRecipe.ingredients.length > 0;

  return (
    <>
      <tr
        className={`border-b border-peach/20 ${isExpandable ? 'cursor-pointer hover:bg-peach/10' : ''}`}
        onClick={isExpandable ? () => setExpanded(!expanded) : undefined}
      >
        <td className="py-1.5 text-bark" style={{ paddingLeft: `${depth * 20 + 4}px` }}>
          <span className="inline-flex items-center gap-1.5">
            {isExpandable && (
              <span
                className={`inline-block text-xs text-coral transition-transform ${expanded ? 'rotate-90' : ''}`}
              >
                ▶
              </span>
            )}
            <span className={isExpandable ? 'text-coral font-medium' : ''}>{name}</span>
            {isExpandable && (
              <span className="text-[10px] text-wood/60 font-normal">(recipe)</span>
            )}
          </span>
        </td>
        <td className="py-1.5 text-center text-bark">{effectiveQty}</td>
        <td className="py-1.5 text-right text-wood">{formatGold(unit)}</td>
        <td className="py-1.5 text-right text-bark font-medium">{formatGold(sub)}</td>
      </tr>
      {expanded && subRecipe && subRecipe.ingredients.map((ri) => (
        <IngredientRow
          key={`${ingredientId}-${ri.ingredientId}-d${depth}`}
          ingredientId={ri.ingredientId}
          quantity={ri.quantity}
          depth={depth + 1}
          parentMultiplier={effectiveQty}
        />
      ))}
    </>
  );
}

/* ================================================================
   Recipe Detail Modal
   ================================================================ */

function RecipeModal({
  recipe,
  star,
  onClose,
  onAdd,
}: {
  recipe: Recipe;
  star: StarRatingType;
  onClose: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-peach/40 text-bark text-xl leading-none transition-colors"
          title="Close"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-bark pr-8 mb-1">{recipe.name}</h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="sky">Lv&nbsp;{recipe.level}</Badge>
          <Badge variant={categoryColor[recipe.category]}>{categoryLabel(recipe.category)}</Badge>
          {recipe.isTbd && <TbdBadge />}
          {recipe.isComposite && <Badge variant="peach">Composite</Badge>}
        </div>

        {/* Ingredient table */}
        {recipe.ingredients.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-bark mb-1">Ingredients</h3>
            {recipe.isComposite && (
              <p className="text-xs text-wood/70 mb-2">Click a recipe ingredient to expand its sub-ingredients.</p>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-wood border-b border-peach/30">
                  <th className="py-1 font-medium">Item</th>
                  <th className="py-1 font-medium text-center">Qty</th>
                  <th className="py-1 font-medium text-right">Unit</th>
                  <th className="py-1 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {recipe.ingredients.map((ri) => (
                  <IngredientRow
                    key={ri.ingredientId}
                    ingredientId={ri.ingredientId}
                    quantity={ri.quantity}
                    depth={0}
                    parentMultiplier={1}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold text-bark">
                  <td className="pt-1" colSpan={3}>
                    Total cost
                  </td>
                  <td className="pt-1 text-right">{formatGold(recipe.costToMake)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Star price table */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-bark mb-1">Sell Prices &amp; Profit</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-wood border-b border-peach/30">
                <th className="py-1 font-medium">Star</th>
                <th className="py-1 font-medium text-right">Sell</th>
                <th className="py-1 font-medium text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3, 4, 5] as StarRatingType[]).map((s) => {
                const sell = getSellPrice(recipe, s);
                const profit = getProfit(recipe, s);
                const isSelected = s === star;
                return (
                  <tr
                    key={s}
                    className={`border-b border-peach/20 ${isSelected ? 'bg-peach/20 font-semibold' : ''}`}
                  >
                    <td className="py-1 text-bark">
                      {'★'.repeat(s)}
                      {'☆'.repeat(5 - s)}
                    </td>
                    <td className="py-1 text-right text-bark">{formatGold(sell)}</td>
                    <td
                      className={`py-1 text-right ${
                        profit !== null && profit >= 0 ? 'text-sage' : 'text-coral'
                      }`}
                    >
                      {formatProfit(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Extra info */}
        <div className="flex flex-col gap-1 text-sm text-bark mb-4">
          {recipe.energy !== null && (
            <p>
              <span className="font-medium text-wood">Energy:</span> {recipe.energy}
            </p>
          )}
          {recipe.buff && (
            <p>
              <span className="font-medium text-wood">Buff:</span> {recipe.buff}
            </p>
          )}
          <p>
            <span className="font-medium text-wood">Unlock:</span> {recipe.unlock.description}
            {recipe.unlock.recipeCost != null && ` (${formatGold(recipe.unlock.recipeCost)})`}
          </p>
          {recipe.notes && (
            <p className="text-xs text-wood italic">{recipe.notes}</p>
          )}
        </div>

        {/* Add to Planner */}
        <button
          onClick={onAdd}
          className="w-full py-2.5 rounded-lg bg-sage text-white font-semibold hover:bg-sage/80 transition-colors"
        >
          Add to Planner
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   RecipesPage
   ================================================================ */

export function RecipesPage() {
  const { addItem } = useBatchPlanner();

  /* ── State ───────────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | 'all'>('all');
  const [showTbd, setShowTbd] = useState(true);
  const [star, setStar] = useState<StarRatingType>(1);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  /* ── Derived list ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = recipes;

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }

    // Level
    if (levelFilter !== 'all') {
      list = list.filter((r) => r.level === levelFilter);
    }

    // Category
    if (categoryFilter !== 'all') {
      list = list.filter((r) => r.category === categoryFilter);
    }

    // TBD toggle
    if (!showTbd) {
      list = list.filter((r) => !r.isTbd);
    }

    // Sort
    const sorted = [...list];
    sorted.sort((a, b) => {
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
  }, [search, levelFilter, categoryFilter, showTbd, sortKey, star]);

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleAdd = (recipeId: string) => {
    addItem(recipeId, 1, star);
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-bark">Recipe Browser</h1>
        <p className="text-wood text-sm mt-1">
          Browse all {recipes.length} recipes. Click a card for full details.
        </p>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-wood mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="w-full px-3 py-2 rounded-lg border border-peach/60 bg-white text-bark text-sm focus:outline-none focus:ring-2 focus:ring-coral/40"
          />
        </div>

        {/* Level filter */}
        <div>
          <label className="block text-xs font-medium text-wood mb-1">Level</label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
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
            onChange={(e) => setCategoryFilter(e.target.value as RecipeCategory | 'all')}
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
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-2 rounded-lg border border-peach/60 bg-white text-bark text-sm focus:outline-none focus:ring-2 focus:ring-coral/40"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Star rating */}
        <div>
          <label className="block text-xs font-medium text-wood mb-1">Star Rating</label>
          <StarRating value={star} onChange={setStar} size="md" />
        </div>

        {/* Show TBD */}
        <label className="flex items-center gap-2 text-sm text-bark cursor-pointer select-none pb-0.5">
          <input
            type="checkbox"
            checked={showTbd}
            onChange={(e) => setShowTbd(e.target.checked)}
            className="rounded border-peach text-coral focus:ring-coral/40"
          />
          Show TBD
        </label>
      </div>

      {/* Result count */}
      <p className="text-xs text-wood">
        Showing {filtered.length} of {recipes.length} recipes
      </p>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-wood">No recipes match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              star={star}
              onOpen={() => setSelectedRecipe(recipe)}
              onAdd={() => handleAdd(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          star={star}
          onClose={() => setSelectedRecipe(null)}
          onAdd={() => {
            handleAdd(selectedRecipe.id);
            setSelectedRecipe(null);
          }}
        />
      )}
    </div>
  );
}
