import { useState, useMemo, useRef, useEffect } from 'react';
import { recipes } from '../data/recipes';
import { ingredients } from '../data/ingredients';
import type { Recipe, StarRating as StarRatingType, StarOdds } from '../data/types';
import { DEFAULT_STAR_ODDS } from '../data/constants';
import { getSellPrice, computeBatchSummary, findWildcardsInRecipe, getIngredientCost, resolveWildcardDefault, computeExpectedRevenue } from '../utils/calculations';
import { formatGold } from '../utils/formatters';
import { StarRating } from '../components/StarRating';
import { NumberInput } from '../components/NumberInput';
import { Badge } from '../components/Badge';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { RecipeModal } from '../components/RecipeModal';
import { useBatchPlanner } from '../context/BatchPlannerContext';
import { FarmPlanner } from '../components/FarmPlanner';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';

const SOURCE_BADGE_VARIANT: Record<string, 'coral' | 'sage' | 'sky' | 'mint' | 'peach' | 'wood' | 'gray'> = {
  shop: 'coral',
  foraged: 'sage',
  farmed: 'mint',
  fished: 'sky',
  special: 'peach',
  crafted: 'wood',
};

const SOURCE_LABEL: Record<string, string> = {
  shop: 'Shop',
  foraged: 'Foraged',
  farmed: 'Farmed',
  fished: 'Fished',
  special: 'Special',
  crafted: 'Crafted',
};

export function PlannerPage() {
  const { items, addItem, removeItem, updateItem, clearItems } = useBatchPlanner();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Wildcard overrides & star odds (persisted)
  const [wildcardOverrides, setWildcardOverrides] = useLocalStorage<Record<string, string>>('heartopia-wildcard-overrides', {});
  const [starOdds, setStarOdds] = useLocalStorage<StarOdds>('heartopia-star-odds', DEFAULT_STAR_ODDS);

  // Inventory integration
  const [useInventory, setUseInventory] = useLocalStorage<boolean>('heartopia-use-inventory', false);
  const [inventory, setInventory] = useLocalStorage<Record<string, number>>('heartopia-inventory', {});
  const [confirmDeduct, setConfirmDeduct] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter recipes for dropdown (exclude failures, match by name)
  const filteredRecipes = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return recipes
      .filter((r) => r.category !== 'failure' && r.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [search]);

  // Find all active wildcards across batch items
  const activeWildcards = useMemo(() => {
    const allIds = new Set<string>();
    for (const item of items) {
      for (const wId of findWildcardsInRecipe(item.recipeId)) {
        allIds.add(wId);
      }
    }
    // Filter to those with multiple options
    return Array.from(allIds).filter((id) => {
      const ing = ingredients[id];
      return ing?.wildcardOptions && ing.wildcardOptions.length > 1;
    });
  }, [items]);

  // Compute the batch summary (with wildcard overrides)
  const summary = useMemo(() => computeBatchSummary(items, wildcardOverrides), [items, wildcardOverrides]);

  // Expected revenue using star odds
  const expectedRevenue = useMemo(() => computeExpectedRevenue(items, starOdds), [items, starOdds]);

  // Adjusted ingredients: subtract inventory when toggle is on
  const adjustedIngredients = useMemo(() => {
    if (!useInventory) return summary.ingredients;
    return summary.ingredients.map((ing) => {
      const inStock = Math.min(inventory[ing.ingredientId] ?? 0, ing.totalQuantity);
      const stillNeeded = ing.totalQuantity - inStock;
      return {
        ...ing,
        totalQuantity: stillNeeded,
        totalCost: ing.unitCost !== null ? ing.unitCost * stillNeeded : null,
        daysNeeded: ing.dailyLimit ? Math.ceil(stillNeeded / ing.dailyLimit) : null,
      };
    });
  }, [summary.ingredients, useInventory, inventory]);

  // Adjusted total cost
  const adjustedTotalCost = useMemo(() => {
    let cost: number | null = 0;
    for (const ing of adjustedIngredients) {
      if (ing.totalCost === null) { cost = null; break; }
      if (cost !== null) cost += ing.totalCost;
    }
    return cost;
  }, [adjustedIngredients]);

  const displayCost = useInventory ? adjustedTotalCost : summary.totalCost;
  const displayProfit = displayCost !== null && summary.totalRevenue !== null ? summary.totalRevenue - displayCost : null;
  const expectedProfit = displayCost !== null ? expectedRevenue - displayCost : null;

  // Separate shop ingredients for the shopping list (exclude zero-qty when using inventory)
  const shopIngredients = useMemo(
    () => adjustedIngredients.filter((ing) => ing.source === 'shop' && ing.totalQuantity > 0),
    [adjustedIngredients],
  );

  // Separate farmed ingredients for the farm planner (exclude zero-qty when using inventory)
  const farmedIngredients = useMemo(
    () => adjustedIngredients.filter((ing) => ing.source === 'farmed' && ing.totalQuantity > 0),
    [adjustedIngredients],
  );

  // Shopping days from adjusted shop ingredients
  const shoppingDays = useMemo(() => {
    let maxDays = 0;
    for (const ing of shopIngredients) {
      if (ing.daysNeeded !== null && ing.daysNeeded > maxDays) maxDays = ing.daysNeeded;
    }
    return Math.max(1, maxDays);
  }, [shopIngredients]);

  // Group all ingredients by source for the ingredient summary
  const ingredientsBySource = useMemo(() => {
    const groups: Record<string, typeof summary.ingredients> = {};
    for (const ing of adjustedIngredients) {
      if (!groups[ing.source]) groups[ing.source] = [];
      groups[ing.source].push(ing);
    }
    return groups;
  }, [adjustedIngredients]);

  const handleSelectRecipe = (recipeId: string) => {
    addItem(recipeId);
    setSearch('');
    setDropdownOpen(false);
  };

  const handleClearAll = () => {
    if (confirmClear) {
      clearItems();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  const handleDeductAndClear = () => {
    if (confirmDeduct) {
      setInventory((prev) => {
        const updated = { ...prev };
        for (const ing of summary.ingredients) {
          if (ing.ingredientId in updated) {
            updated[ing.ingredientId] = Math.max(0, (updated[ing.ingredientId] ?? 0) - ing.totalQuantity);
          }
        }
        return updated;
      });
      clearItems();
      setConfirmDeduct(false);
    } else {
      setConfirmDeduct(true);
    }
  };

  // Reset clear confirmation after a few seconds
  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  useEffect(() => {
    if (!confirmDeduct) return;
    const timer = setTimeout(() => setConfirmDeduct(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDeduct]);

  // Empty state
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-bark">Batch Cooking Planner</h1>

        {/* Recipe Selector -- always visible */}
        <div ref={searchRef} className="relative max-w-md">
          <input
            type="text"
            placeholder="Search recipes to add..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => search.trim() && setDropdownOpen(true)}
            className="w-full rounded-xl border border-peach/50 bg-white px-4 py-3 text-bark placeholder:text-wood/60 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/40 shadow-sm"
          />
          {dropdownOpen && filteredRecipes.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full rounded-xl bg-white border border-peach/30 shadow-lg overflow-hidden max-h-80 overflow-y-auto">
              {filteredRecipes.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectRecipe(recipe.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-peach/30 text-bark text-sm transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <span className="font-medium">{recipe.name}</span>
                    <span className="text-wood/60 ml-2">Lv{recipe.level}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Empty state message */}
        <div className="rounded-xl bg-white shadow-sm border border-peach/30 p-12 text-center">
          <span className="text-5xl block mb-4">📋</span>
          <h2 className="text-xl font-bold text-bark mb-2">No recipes in your batch yet</h2>
          <p className="text-wood mb-6 max-w-md mx-auto">
            Search for recipes above to start planning your cooking session, or browse
            the recipe list to find something to cook.
          </p>
          <Link
            to="/recipes"
            className="inline-block bg-coral text-white font-medium rounded-lg px-6 py-2 no-underline hover:bg-coral/90 transition-colors"
          >
            Browse Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-bark">Batch Cooking Planner</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-bark cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useInventory}
              onChange={(e) => setUseInventory(e.target.checked)}
              className="accent-coral w-4 h-4 cursor-pointer"
            />
            Use Inventory
          </label>
          <button
            onClick={handleClearAll}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors ${
              confirmClear
                ? 'bg-coral text-white'
                : 'bg-peach/60 text-bark hover:bg-coral/30'
            }`}
          >
            {confirmClear ? 'Click again to confirm' : 'Clear All'}
          </button>
        </div>
      </div>

      {/* Recipe Selector */}
      <div ref={searchRef} className="relative max-w-md">
        <input
          type="text"
          placeholder="Search recipes to add..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => search.trim() && setDropdownOpen(true)}
          className="w-full rounded-xl border border-peach/50 bg-white px-4 py-3 text-bark placeholder:text-wood/60 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/40 shadow-sm"
        />
        {dropdownOpen && filteredRecipes.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-xl bg-white border border-peach/30 shadow-lg overflow-hidden max-h-80 overflow-y-auto">
            {filteredRecipes.map((recipe) => (
              <li key={recipe.id}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectRecipe(recipe.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-peach/30 text-bark text-sm transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="font-medium">{recipe.name}</span>
                  <span className="text-wood/60 ml-2">Lv{recipe.level}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Wildcard Ingredient Overrides */}
      {activeWildcards.length > 0 && (
        <section className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-hidden">
          <div className="px-5 py-3 border-b border-peach/20 bg-peach/10">
            <h2 className="text-lg font-bold text-bark">Wildcard Ingredients</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeWildcards.map((wildcardId) => {
              const wIng = ingredients[wildcardId];
              if (!wIng?.wildcardOptions) return null;
              const defaultOption = resolveWildcardDefault(wildcardId);
              const currentValue = wildcardOverrides[wildcardId] || defaultOption || '';

              return (
                <div key={wildcardId}>
                  <label className="block text-xs font-semibold text-wood mb-1">{wIng.name}</label>
                  <select
                    value={currentValue}
                    onChange={(e) => {
                      setWildcardOverrides((prev) => ({ ...prev, [wildcardId]: e.target.value }));
                    }}
                    className="w-full rounded-lg border border-peach/50 bg-white px-3 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-coral/40"
                  >
                    {wIng.wildcardOptions.map((optionId) => {
                      const optIng = ingredients[optionId];
                      const optName = optIng?.name ?? optionId;
                      const optCost = getIngredientCost(optionId);
                      return (
                        <option key={optionId} value={optionId}>
                          {optName} ({optCost !== null ? `${optCost}G` : 'TBD'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Batch List */}
      <section className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-clip">
        <div className="px-5 py-3 border-b border-peach/20 bg-peach/10">
          <h2 className="text-lg font-bold text-bark">
            Batch List ({items.length} {items.length === 1 ? 'recipe' : 'recipes'})
          </h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-wood">
                <th className="px-5 py-3 font-semibold sticky top-[57px] z-20 bg-white border-b border-peach/20">Recipe</th>
                <th className="px-5 py-3 font-semibold sticky top-[57px] z-20 bg-white border-b border-peach/20">Qty</th>
                <th className="px-5 py-3 font-semibold sticky top-[57px] z-20 bg-white border-b border-peach/20">Stars</th>
                <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-peach/20">Sell Total</th>
                <th className="px-5 py-3 font-semibold w-12 sticky top-[57px] z-20 bg-white border-b border-peach/20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const recipe = recipes.find((r) => r.id === item.recipeId);
                if (!recipe) return null;
                const sellPrice = getSellPrice(recipe, item.starRating);
                const itemTotal = sellPrice !== null ? sellPrice * item.quantity : null;

                return (
                  <tr
                    key={`${item.recipeId}-${index}`}
                    className="border-b border-peach/10 hover:bg-peach/5 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-bark">
                      <button
                        onClick={() => setSelectedRecipe(recipe)}
                        className="bg-transparent border-none p-0 font-medium text-bark hover:text-coral cursor-pointer transition-colors underline decoration-peach/40 hover:decoration-coral/60"
                      >
                        {recipe.name}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <NumberInput
                        value={item.quantity}
                        onChange={(qty) => updateItem(index, { quantity: qty })}
                        min={1}
                        max={999}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <StarRating
                        value={item.starRating}
                        onChange={(star: StarRatingType) => updateItem(index, { starRating: star })}
                        size="sm"
                      />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-bark">
                      {formatGold(itemTotal)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => removeItem(index)}
                        className="w-7 h-7 rounded-md bg-coral/20 hover:bg-coral/40 text-coral font-bold text-sm border-none cursor-pointer transition-colors"
                        title="Remove"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-peach/10">
          {items.map((item, index) => {
            const recipe = recipes.find((r) => r.id === item.recipeId);
            if (!recipe) return null;
            const sellPrice = getSellPrice(recipe, item.starRating);
            const itemTotal = sellPrice !== null ? sellPrice * item.quantity : null;

            return (
              <div
                key={`${item.recipeId}-${index}`}
                className="p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => setSelectedRecipe(recipe)}
                    className="bg-transparent border-none p-0 font-medium text-bark hover:text-coral cursor-pointer transition-colors underline decoration-peach/40 hover:decoration-coral/60 text-left"
                  >
                    {recipe.name}
                  </button>
                  <button
                    onClick={() => removeItem(index)}
                    className="w-7 h-7 rounded-md bg-coral/20 hover:bg-coral/40 text-coral font-bold text-sm border-none cursor-pointer transition-colors flex-shrink-0"
                    title="Remove"
                  >
                    X
                  </button>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-wood">Qty:</span>
                    <NumberInput
                      value={item.quantity}
                      onChange={(qty) => updateItem(index, { quantity: qty })}
                      min={1}
                      max={999}
                    />
                  </div>
                  <StarRating
                    value={item.starRating}
                    onChange={(star: StarRatingType) => updateItem(index, { starRating: star })}
                    size="sm"
                  />
                </div>
                <div className="text-sm font-semibold text-bark">
                  Sell Total: {formatGold(itemTotal)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Star Odds */}
        <div className="px-5 py-3 border-t border-peach/20">
          <CollapsibleSection title="Star Odds (Expected Value)">
            <div className="space-y-3">
              <p className="text-xs text-wood/70 italic">
                Star probabilities are speculative estimates. Actual rates depend on cooking level,
                seasoning, rainbow mechanics, and other in-game factors that have not been
                scientifically confirmed.
              </p>
              <div className="grid grid-cols-5 gap-3">
                {([1, 2, 3, 4, 5] as StarRatingType[]).map((star) => (
                  <div key={star} className="text-center">
                    <label className="block text-xs font-semibold text-wood mb-1">
                      {star}★
                    </label>
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={starOdds[star]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          setStarOdds((prev) => ({ ...prev, [star]: val }));
                        }}
                        className="w-14 rounded-lg border border-peach/50 bg-white px-2 py-1 text-sm text-bark text-center focus:outline-none focus:ring-2 focus:ring-coral/40"
                      />
                      <span className="text-xs text-wood">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStarOdds(DEFAULT_STAR_ODDS)}
                className="text-xs text-coral hover:text-coral/80 underline cursor-pointer bg-transparent border-none p-0"
              >
                Reset to defaults
              </button>
            </div>
          </CollapsibleSection>
        </div>
      </section>

      {/* Ingredient Summary */}
      <section className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-clip">
        <div className="px-5 py-3 border-b border-peach/20 bg-peach/10">
          <h2 className="text-lg font-bold text-bark">Ingredient Summary</h2>
        </div>
        <div className="overflow-x-auto md:overflow-x-clip">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-wood">
                <th className="px-5 py-3 font-semibold sticky top-[57px] z-20 bg-white border-b border-peach/20">Ingredient</th>
                <th className="px-5 py-3 font-semibold sticky top-[57px] z-20 bg-white border-b border-peach/20">Source</th>
                <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-peach/20">Qty</th>
                {useInventory && <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-peach/20">In Stock</th>}
                {useInventory && <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-peach/20">Still Need</th>}
                {useInventory && <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-peach/20">Remaining Stock</th>}
                <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-peach/20">Cost/ea</th>
                <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-peach/20">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ingredientsBySource).map(([source, ings]) => (
                ings.map((ing, i) => {
                  const ingData = ingredients[ing.ingredientId];
                  const name = ingData?.name ?? ing.ingredientId;
                  const originalIng = useInventory ? summary.ingredients.find((s) => s.ingredientId === ing.ingredientId) : null;
                  const originalQty = originalIng?.totalQuantity ?? ing.totalQuantity;
                  const inStock = useInventory ? Math.min(inventory[ing.ingredientId] ?? 0, originalQty) : 0;
                  const covered = useInventory && ing.totalQuantity === 0;
                  return (
                    <tr
                      key={ing.ingredientId}
                      className={`border-b border-peach/10 ${i === 0 ? 'border-t border-peach/20' : ''} ${covered ? 'opacity-40' : ''}`}
                    >
                      <td className="px-5 py-2.5 text-bark font-medium">{name}</td>
                      <td className="px-5 py-2.5">
                        <Badge variant={SOURCE_BADGE_VARIANT[source] ?? 'gray'}>
                          {SOURCE_LABEL[source] ?? source}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 text-right text-bark">{originalQty}</td>
                      {useInventory && <td className="px-5 py-2.5 text-right text-sage font-medium">{inStock}</td>}
                      {useInventory && <td className="px-5 py-2.5 text-right text-bark font-medium">{ing.totalQuantity}</td>}
                      {useInventory && (() => {
                        const remaining = (inventory[ing.ingredientId] ?? 0) - originalQty;
                        return (
                          <td className={`px-5 py-2.5 text-right font-medium ${remaining >= 0 ? 'text-sage' : 'text-coral'}`}>
                            {remaining}
                          </td>
                        );
                      })()}
                      <td className="px-5 py-2.5 text-right text-wood">
                        {formatGold(ing.unitCost)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold text-bark">
                        {formatGold(ing.totalCost)}
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Shopping List */}
      {shopIngredients.length > 0 && (
        <section className="rounded-xl bg-white shadow-sm border-2 border-coral/40 overflow-clip">
          <div className="px-5 py-3 border-b border-coral/20 bg-coral/10">
            <h2 className="text-lg font-bold text-bark">
              Shopping List (Massimo's Store)
            </h2>
          </div>
          <div className="overflow-x-auto md:overflow-x-clip">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-wood">
                  <th className="px-5 py-3 font-semibold sticky top-[57px] z-20 bg-white border-b border-coral/20">Ingredient</th>
                  <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-coral/20">Qty</th>
                  <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-coral/20">Cost/ea</th>
                  <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-coral/20">Total</th>
                  <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-coral/20">Daily Limit</th>
                  <th className="px-5 py-3 font-semibold text-right sticky top-[57px] z-20 bg-white border-b border-coral/20">Days Needed</th>
                </tr>
              </thead>
              <tbody>
                {shopIngredients.map((ing) => {
                  const ingData = ingredients[ing.ingredientId];
                  const name = ingData?.name ?? ing.ingredientId;
                  const isBottleneck = ing.daysNeeded !== null && ing.daysNeeded > 1;

                  return (
                    <tr
                      key={ing.ingredientId}
                      className={`border-b border-coral/10 transition-colors ${
                        isBottleneck ? 'bg-coral/10' : ''
                      }`}
                    >
                      <td className={`px-5 py-2.5 font-medium ${isBottleneck ? 'text-coral' : 'text-bark'}`}>
                        {name}
                        {isBottleneck && <span className="ml-1.5 text-xs">!!!</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right text-bark">{ing.totalQuantity}</td>
                      <td className="px-5 py-2.5 text-right text-wood">
                        {formatGold(ing.unitCost)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold text-bark">
                        {formatGold(ing.totalCost)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-wood">
                        {ing.dailyLimit ?? '-'}
                      </td>
                      <td className={`px-5 py-2.5 text-right font-semibold ${isBottleneck ? 'text-coral' : 'text-bark'}`}>
                        {ing.daysNeeded ?? '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-coral/20 bg-coral/5 flex items-center gap-2">
            <span className="text-sm text-wood">Total Shopping Days:</span>
            <Badge variant={shoppingDays > 1 ? 'coral' : 'sage'}>
              {shoppingDays} {shoppingDays === 1 ? 'day' : 'days'}
            </Badge>
          </div>
        </section>
      )}

      {/* Farm Planner */}
      {farmedIngredients.length > 0 && <FarmPlanner farmedIngredients={farmedIngredients} />}

      {/* Profit Summary */}
      <section className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Cost */}
          <div className="rounded-xl bg-peach/40 border border-peach/60 p-6 text-center">
            <p className="text-sm font-semibold text-wood mb-1">
              {useInventory ? 'Remaining Cost' : 'Total Cost'}
            </p>
            <p className="text-2xl font-bold text-bark">{formatGold(displayCost)}</p>
            {useInventory && displayCost !== summary.totalCost && (
              <p className="text-xs text-wood mt-1 line-through">{formatGold(summary.totalCost)}</p>
            )}
          </div>

          {/* Total Revenue */}
          <div className="rounded-xl bg-mint/40 border border-mint/60 p-6 text-center">
            <p className="text-sm font-semibold text-wood mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-bark">{formatGold(summary.totalRevenue)}</p>
            <p className="text-xs text-wood mt-1">Expected: {formatGold(expectedRevenue)}</p>
          </div>

          {/* Total Profit */}
          <div
            className={`rounded-xl border p-6 text-center ${
              displayProfit !== null && displayProfit >= 0
                ? 'bg-sage/40 border-sage/60'
                : 'bg-coral/20 border-coral/40'
            }`}
          >
            <p className="text-sm font-semibold text-wood mb-1">Total Profit</p>
            <p
              className={`text-2xl font-bold ${
                displayProfit !== null && displayProfit >= 0 ? 'text-bark' : 'text-coral'
              }`}
            >
              {displayProfit !== null
                ? (displayProfit >= 0 ? '+' : '') + formatGold(displayProfit)
                : 'TBD'}
            </p>
            <p className="text-xs text-wood mt-1">
              Expected: {expectedProfit !== null
                ? (expectedProfit >= 0 ? '+' : '') + formatGold(expectedProfit)
                : 'TBD'}
            </p>
          </div>
        </div>
        <p className="text-xs text-wood/60 text-center">
          Main values assume every dish is the star rating you selected. Expected values are the weighted average across all star levels using your star odds.
        </p>
      </section>

      {/* Deduct Inventory and Clear */}
      {useInventory && (
        <button
          onClick={handleDeductAndClear}
          className={`w-full py-4 rounded-xl text-lg font-bold border-none cursor-pointer transition-colors ${
            confirmDeduct
              ? 'bg-coral text-white'
              : 'bg-sage text-white hover:bg-sage/80'
          }`}
        >
          {confirmDeduct ? 'Click again to confirm' : 'Deduct Inventory and Clear'}
        </button>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          star={selectedRecipe ? (items.find((i) => i.recipeId === selectedRecipe.id)?.starRating ?? 1) : 1}
          onClose={() => setSelectedRecipe(null)}
          onAdd={() => {
            addItem(selectedRecipe.id);
            setSelectedRecipe(null);
          }}
        />
      )}
    </div>
  );
}
