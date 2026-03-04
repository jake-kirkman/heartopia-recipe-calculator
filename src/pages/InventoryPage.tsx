import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { recipes } from '../data/recipes';
import { ingredients } from '../data/ingredients';
import type { Recipe, StarRating as StarRatingType, IngredientSource } from '../data/types';
import { SORT_OPTIONS } from '../data/recipeConstants';
import { computeCraftableCount } from '../utils/calculations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRecipeFilters } from '../hooks/useRecipeFilters';
import { RecipeFilterControls } from '../components/RecipeFilterControls';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeModal } from '../components/RecipeModal';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Badge } from '../components/Badge';
import { useBatchPlanner } from '../context/BatchPlannerContext';

/* ── Inputtable ingredients (not wildcards, not crafted) ─────────── */

const INPUTTABLE_INGREDIENTS = Object.values(ingredients).filter(
  (i) => !i.isWildcard && i.source !== 'crafted',
);

const SOURCE_ORDER: IngredientSource[] = ['shop', 'foraged', 'farmed', 'fished', 'special'];

const SOURCE_LABELS: Record<string, string> = {
  shop: 'Shop',
  foraged: 'Foraged',
  farmed: 'Farmed',
  fished: 'Fished',
  special: 'Special',
};

const GROUPED_INGREDIENTS = SOURCE_ORDER.map((source) => ({
  source,
  label: SOURCE_LABELS[source] ?? source,
  items: INPUTTABLE_INGREDIENTS.filter((i) => i.source === source).sort((a, b) =>
    a.name.localeCompare(b.name),
  ),
})).filter((g) => g.items.length > 0);

/* ── Extended sort options ───────────────────────────────────────── */

const INVENTORY_SORT_OPTIONS = [
  ...SORT_OPTIONS,
  { value: 'craftable-high', label: 'Craftable (high)' },
  { value: 'craftable-low', label: 'Craftable (low)' },
];

/* ================================================================
   InventoryPage
   ================================================================ */

export function InventoryPage() {
  useDocumentMeta({
    title: 'Inventory Checker',
    description: 'Track your Heartopia ingredient inventory and instantly see which recipes you can craft. Enter quantities to find craftable recipes and plan your cooking.',
  });

  const { items, addItem, decrementItem } = useBatchPlanner();

  /* ── Persisted inventory ──────────────────────────────────────── */
  const [inventory, setInventory] = useLocalStorage<Record<string, number>>('heartopia-inventory', {});

  const setIngredientQty = useCallback(
    (id: string, qty: number) => {
      setInventory((prev) => {
        if (qty <= 0) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return { ...prev, [id]: qty };
      });
    },
    [setInventory],
  );

  /* ── Ingredient search ────────────────────────────────────────── */
  const [ingredientSearch, setIngredientSearch] = useState('');

  /* ── Clear confirmation ───────────────────────────────────────── */
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  const handleClearInventory = () => {
    if (confirmClear) {
      setInventory({});
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  /* ── Recipe state ─────────────────────────────────────────────── */
  const [star, setStar] = useState<StarRatingType>(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [craftableOnly, setCraftableOnly] = useState(false);

  /* ── Craftable counts (memoized) ──────────────────────────────── */
  const craftableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const recipe of recipes) {
      counts[recipe.id] = computeCraftableCount(recipe.id, inventory);
    }
    return counts;
  }, [inventory]);

  /* ── Filter recipes ───────────────────────────────────────────── */
  const visibleRecipes = useMemo(() => {
    if (!craftableOnly) return recipes;
    return recipes.filter((r) => (craftableCounts[r.id] ?? 0) > 0);
  }, [craftableOnly, craftableCounts]);

  const customSort = useCallback(
    (sortKey: string, a: Recipe, b: Recipe): number | undefined => {
      if (sortKey === 'craftable-high') {
        return (craftableCounts[b.id] ?? 0) - (craftableCounts[a.id] ?? 0) || a.name.localeCompare(b.name);
      }
      if (sortKey === 'craftable-low') {
        return (craftableCounts[a.id] ?? 0) - (craftableCounts[b.id] ?? 0) || a.name.localeCompare(b.name);
      }
      return undefined;
    },
    [craftableCounts],
  );

  const {
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
  } = useRecipeFilters({
    recipes: visibleRecipes,
    star,
    sortOptions: INVENTORY_SORT_OPTIONS,
    customSort,
  });

  const handleAdd = (recipeId: string) => {
    addItem(recipeId, 1, star);
  };

  /* ── Stocked count per source group ───────────────────────────── */
  const stockedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of GROUPED_INGREDIENTS) {
      counts[group.source] = group.items.filter((i) => (inventory[i.id] ?? 0) > 0).length;
    }
    return counts;
  }, [inventory]);

  /* ── Filter ingredient boxes by search ────────────────────────── */
  const ingredientQuery = ingredientSearch.toLowerCase();

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bark">Inventory Checker</h1>
          <p className="text-wood text-sm mt-1">
            Enter your ingredient quantities to see what you can craft.
          </p>
        </div>
        <button
          onClick={handleClearInventory}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors ${
            confirmClear
              ? 'bg-coral text-white'
              : 'bg-peach/60 text-bark hover:bg-coral/30'
          }`}
        >
          {confirmClear ? 'Click again to confirm' : 'Clear Inventory'}
        </button>
      </div>

      {/* ═══ Ingredient Input Section ═══ */}
      <section className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-peach/20 bg-peach/10 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-bark">Your Ingredients</h2>
          <input
            type="text"
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
            placeholder="Filter ingredients..."
            className="px-3 py-1.5 rounded-lg border border-peach/60 bg-white text-bark text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 w-48"
          />
        </div>
        <div className="p-5 space-y-4">
          {GROUPED_INGREDIENTS.map((group) => {
            const visibleItems = ingredientQuery
              ? group.items.filter((i) => i.name.toLowerCase().includes(ingredientQuery))
              : group.items;

            if (visibleItems.length === 0) return null;

            return (
              <CollapsibleSection
                key={group.source}
                defaultOpen
                title={
                  <span>
                    {group.label}{' '}
                    <span className="text-wood/60 font-normal">
                      ({stockedCounts[group.source] ?? 0}/{group.items.length} stocked)
                    </span>
                  </span>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {visibleItems.map((ing) => {
                    const qty = inventory[ing.id] ?? 0;
                    return (
                      <div
                        key={ing.id}
                        className={`rounded-lg border px-3 py-2 flex flex-col gap-1 ${
                          qty > 0
                            ? 'border-sage/50 bg-sage/10'
                            : 'border-peach/30 bg-white'
                        }`}
                      >
                        <span className="text-xs font-medium text-bark truncate" title={ing.name}>
                          {ing.emoji && <span className="mr-1">{ing.emoji}</span>}
                          {ing.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setIngredientQty(ing.id, Math.max(0, qty - 1))}
                            disabled={qty <= 0}
                            className="w-8 h-8 rounded-md bg-peach/50 hover:bg-peach text-bark font-bold text-lg border-none cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-default"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={9999}
                            value={qty || ''}
                            placeholder="0"
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(9999, Number(e.target.value) || 0));
                              setIngredientQty(ing.id, val);
                            }}
                            className="flex-1 min-w-0 h-8 text-center rounded-md border border-peach/50 bg-white text-bark text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => setIngredientQty(ing.id, Math.min(9999, qty + 1))}
                            disabled={qty >= 9999}
                            className="w-8 h-8 rounded-md bg-peach/50 hover:bg-peach text-bark font-bold text-lg border-none cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-default"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            );
          })}
        </div>
      </section>

      {/* ═══ Recipe Browser Section ═══ */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-bark">Craftable Recipes</h2>

        <RecipeFilterControls
          search={search}
          onSearchChange={setSearch}
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortOptions={effectiveSortOptions}
          star={star}
          onStarChange={setStar}
          showTbd={showTbd}
          onShowTbdChange={setShowTbd}
          filteredCount={filtered.length}
          totalCount={recipes.length}
        >
          <label className="flex items-center gap-2 text-sm text-bark cursor-pointer select-none pb-0.5">
            <input
              type="checkbox"
              checked={craftableOnly}
              onChange={(e) => setCraftableOnly(e.target.checked)}
              className="rounded border-peach text-coral focus:ring-coral/40"
            />
            Craftable only
          </label>
        </RecipeFilterControls>

        {/* Card grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-wood">No recipes match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((recipe) => {
              const count = craftableCounts[recipe.id] ?? 0;
              const plannerItem = items.find(i => i.recipeId === recipe.id && i.starRating === star);
              return (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  star={star}
                  onOpen={() => setSelectedRecipe(recipe)}
                  onIncrement={() => handleAdd(recipe.id)}
                  onDecrement={() => decrementItem(recipe.id, star)}
                  plannerQuantity={plannerItem?.quantity ?? 0}
                  extraInfo={
                    count > 0 ? (
                      <Badge variant="sage">Can make: {count}</Badge>
                    ) : (
                      <Badge variant="gray">Cannot craft</Badge>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Detail modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          star={star}
          onClose={() => setSelectedRecipe(null)}
          onIncrement={() => handleAdd(selectedRecipe.id)}
          onDecrement={() => decrementItem(selectedRecipe.id, star)}
          plannerQuantity={items.find(i => i.recipeId === selectedRecipe.id && i.starRating === star)?.quantity ?? 0}
        />
      )}
    </div>
  );
}
