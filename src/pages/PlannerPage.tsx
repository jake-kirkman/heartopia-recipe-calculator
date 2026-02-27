import { useState, useMemo, useRef, useEffect } from 'react';
import { recipes } from '../data/recipes';
import { ingredients } from '../data/ingredients';
import type { StarRating as StarRatingType } from '../data/types';
import { getSellPrice, computeBatchSummary } from '../utils/calculations';
import { formatGold } from '../utils/formatters';
import { StarRating } from '../components/StarRating';
import { NumberInput } from '../components/NumberInput';
import { Badge } from '../components/Badge';
import { useBatchPlanner } from '../context/BatchPlannerContext';
import { FarmPlanner } from '../components/FarmPlanner';
import { Link } from 'react-router-dom';

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
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Compute the batch summary
  const summary = useMemo(() => computeBatchSummary(items), [items]);

  // Separate shop ingredients for the shopping list
  const shopIngredients = useMemo(
    () => summary.ingredients.filter((ing) => ing.source === 'shop'),
    [summary.ingredients],
  );

  // Separate farmed ingredients for the farm planner
  const farmedIngredients = useMemo(
    () => summary.ingredients.filter((ing) => ing.source === 'farmed'),
    [summary.ingredients],
  );

  // Group all ingredients by source for the ingredient summary
  const ingredientsBySource = useMemo(() => {
    const groups: Record<string, typeof summary.ingredients> = {};
    for (const ing of summary.ingredients) {
      if (!groups[ing.source]) groups[ing.source] = [];
      groups[ing.source].push(ing);
    }
    return groups;
  }, [summary.ingredients]);

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

  // Reset clear confirmation after a few seconds
  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

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

      {/* Batch List */}
      <section className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-peach/20 bg-peach/10">
          <h2 className="text-lg font-bold text-bark">
            Batch List ({items.length} {items.length === 1 ? 'recipe' : 'recipes'})
          </h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-peach/20 text-left text-wood">
                <th className="px-5 py-3 font-semibold">Recipe</th>
                <th className="px-5 py-3 font-semibold">Qty</th>
                <th className="px-5 py-3 font-semibold">Stars</th>
                <th className="px-5 py-3 font-semibold text-right">Sell Total</th>
                <th className="px-5 py-3 font-semibold w-12"></th>
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
                    <td className="px-5 py-3 font-medium text-bark">{recipe.name}</td>
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
                  <span className="font-medium text-bark">{recipe.name}</span>
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
      </section>

      {/* Ingredient Summary */}
      <section className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-peach/20 bg-peach/10">
          <h2 className="text-lg font-bold text-bark">Ingredient Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-peach/20 text-left text-wood">
                <th className="px-5 py-3 font-semibold">Ingredient</th>
                <th className="px-5 py-3 font-semibold">Source</th>
                <th className="px-5 py-3 font-semibold text-right">Qty</th>
                <th className="px-5 py-3 font-semibold text-right">Cost/ea</th>
                <th className="px-5 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ingredientsBySource).map(([source, ings]) => (
                ings.map((ing, i) => {
                  const ingData = ingredients[ing.ingredientId];
                  const name = ingData?.name ?? ing.ingredientId;
                  return (
                    <tr
                      key={ing.ingredientId}
                      className={`border-b border-peach/10 ${i === 0 ? 'border-t border-peach/20' : ''}`}
                    >
                      <td className="px-5 py-2.5 text-bark font-medium">{name}</td>
                      <td className="px-5 py-2.5">
                        <Badge variant={SOURCE_BADGE_VARIANT[source] ?? 'gray'}>
                          {SOURCE_LABEL[source] ?? source}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 text-right text-bark">{ing.totalQuantity}</td>
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
        <section className="rounded-xl bg-white shadow-sm border-2 border-coral/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-coral/20 bg-coral/10">
            <h2 className="text-lg font-bold text-bark">
              Shopping List (Massimo's Store)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-coral/20 text-left text-wood">
                  <th className="px-5 py-3 font-semibold">Ingredient</th>
                  <th className="px-5 py-3 font-semibold text-right">Qty</th>
                  <th className="px-5 py-3 font-semibold text-right">Cost/ea</th>
                  <th className="px-5 py-3 font-semibold text-right">Total</th>
                  <th className="px-5 py-3 font-semibold text-right">Daily Limit</th>
                  <th className="px-5 py-3 font-semibold text-right">Days Needed</th>
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
            <Badge variant={summary.shoppingDays > 1 ? 'coral' : 'sage'}>
              {summary.shoppingDays} {summary.shoppingDays === 1 ? 'day' : 'days'}
            </Badge>
          </div>
        </section>
      )}

      {/* Farm Planner */}
      {farmedIngredients.length > 0 && <FarmPlanner farmedIngredients={farmedIngredients} />}

      {/* Profit Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Cost */}
        <div className="rounded-xl bg-peach/40 border border-peach/60 p-6 text-center">
          <p className="text-sm font-semibold text-wood mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-bark">{formatGold(summary.totalCost)}</p>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl bg-mint/40 border border-mint/60 p-6 text-center">
          <p className="text-sm font-semibold text-wood mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-bark">{formatGold(summary.totalRevenue)}</p>
        </div>

        {/* Total Profit */}
        <div
          className={`rounded-xl border p-6 text-center ${
            summary.totalProfit !== null && summary.totalProfit >= 0
              ? 'bg-sage/40 border-sage/60'
              : 'bg-coral/20 border-coral/40'
          }`}
        >
          <p className="text-sm font-semibold text-wood mb-1">Total Profit</p>
          <p
            className={`text-2xl font-bold ${
              summary.totalProfit !== null && summary.totalProfit >= 0 ? 'text-bark' : 'text-coral'
            }`}
          >
            {summary.totalProfit !== null
              ? (summary.totalProfit >= 0 ? '+' : '') + formatGold(summary.totalProfit)
              : 'TBD'}
          </p>
        </div>
      </section>
    </div>
  );
}
