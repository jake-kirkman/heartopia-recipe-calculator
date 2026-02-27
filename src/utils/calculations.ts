import type { StarRating, Recipe, BatchItem, AggregatedIngredient, BatchSummary, StarOdds } from '../data/types';
import { ingredients } from '../data/ingredients';
import { recipes } from '../data/recipes';
import { STAR_MULTIPLIERS } from '../data/constants';

export function getSellPrice(recipe: Recipe, star: StarRating): number | null {
  if (recipe.basePrice === null) return null;
  return Math.round(recipe.basePrice * STAR_MULTIPLIERS[star]);
}

/** Resolve a recipe-as-ingredient to its base recipe */
function findRecipeForIngredient(ingredientId: string): Recipe | undefined {
  if (!ingredientId.startsWith('recipe-')) return undefined;
  const recipeId = ingredientId.slice('recipe-'.length);
  return recipes.find((r) => r.id === recipeId);
}

// ─── Wildcard Resolution ──────────────────────────────────────────

/** Get the effective cost of an ingredient (base cost or computed cost for recipe-as-ingredient) */
export function getIngredientCost(ingredientId: string): number | null {
  const subRecipe = findRecipeForIngredient(ingredientId);
  if (subRecipe) return computeCostToMake(subRecipe);
  const ing = ingredients[ingredientId];
  if (!ing) return null;
  return ing.cost;
}

/** Resolve a wildcard to its cheapest option. Returns the option ID or null if unresolvable. */
export function resolveWildcardDefault(wildcardId: string): string | null {
  const ing = ingredients[wildcardId];
  if (!ing?.isWildcard || !ing.wildcardOptions?.length) return null;

  let cheapest: string | null = null;
  let cheapestCost: number | null = null;

  for (const optionId of ing.wildcardOptions) {
    const cost = getIngredientCost(optionId);
    if (cost === null) continue;
    if (cheapestCost === null || cost < cheapestCost) {
      cheapestCost = cost;
      cheapest = optionId;
    }
  }

  return cheapest;
}

/** Resolve a wildcard ingredient ID using overrides or cheapest default */
function resolveWildcard(ingredientId: string, overrides?: Record<string, string>): string {
  const ing = ingredients[ingredientId];
  if (!ing?.isWildcard) return ingredientId;

  if (overrides?.[ingredientId]) return overrides[ingredientId];
  return resolveWildcardDefault(ingredientId) ?? ingredientId;
}

/** Recursively walk a recipe's ingredients and return all wildcard IDs found */
export function findWildcardsInRecipe(recipeId: string): Set<string> {
  const result = new Set<string>();
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return result;

  for (const ri of recipe.ingredients) {
    const ing = ingredients[ri.ingredientId];
    if (ing?.isWildcard) {
      result.add(ri.ingredientId);
    }
    // Recurse into sub-recipes
    const subRecipe = findRecipeForIngredient(ri.ingredientId);
    if (subRecipe) {
      for (const wId of findWildcardsInRecipe(subRecipe.id)) {
        result.add(wId);
      }
    }
  }

  return result;
}

// ─── Cost / Profit Calculations ───────────────────────────────────

/** Compute the total ingredient cost of a recipe at runtime */
export function computeCostToMake(recipe: Recipe, overrides?: Record<string, string>): number | null {
  if (recipe.isTbd) return null;
  let total = 0;
  for (const ri of recipe.ingredients) {
    const effectiveId = resolveWildcard(ri.ingredientId, overrides);
    const subRecipe = findRecipeForIngredient(effectiveId);
    if (subRecipe) {
      const subCost = computeCostToMake(subRecipe, overrides);
      if (subCost === null) return null;
      total += subCost * ri.quantity;
    } else {
      const ing = ingredients[effectiveId];
      if (!ing || ing.cost === null) return null;
      total += ing.cost * ri.quantity;
    }
  }
  return total;
}

export function getProfit(recipe: Recipe, star: StarRating, overrides?: Record<string, string>): number | null {
  const sell = getSellPrice(recipe, star);
  const cost = computeCostToMake(recipe, overrides);
  if (sell === null || cost === null) return null;
  return sell - cost;
}

export function getMargin(recipe: Recipe, star: StarRating, overrides?: Record<string, string>): number | null {
  const sell = getSellPrice(recipe, star);
  const profit = getProfit(recipe, star, overrides);
  if (sell === null || profit === null || sell === 0) return null;
  return (profit / sell) * 100;
}

// ─── Base Ingredient Resolution ───────────────────────────────────

/** Recursively resolve composite recipes to base ingredients */
export function resolveBaseIngredients(
  recipeId: string,
  quantity: number,
  overrides?: Record<string, string>,
): Map<string, number> {
  const result = new Map<string, number>();
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return result;

  for (const ri of recipe.ingredients) {
    const effectiveId = resolveWildcard(ri.ingredientId, overrides);
    const subRecipe = findRecipeForIngredient(effectiveId);
    if (subRecipe) {
      // This ingredient is itself a recipe - recurse
      const subIngredients = resolveBaseIngredients(subRecipe.id, ri.quantity * quantity, overrides);
      for (const [id, qty] of subIngredients) {
        result.set(id, (result.get(id) || 0) + qty);
      }
    } else {
      // Base ingredient
      result.set(effectiveId, (result.get(effectiveId) || 0) + ri.quantity * quantity);
    }
  }

  return result;
}

// ─── Batch Summary ────────────────────────────────────────────────

export function computeBatchSummary(items: BatchItem[], overrides?: Record<string, string>): BatchSummary {
  const allIngredients = new Map<string, number>();

  // Aggregate all base ingredients across all batch items
  for (const item of items) {
    const resolved = resolveBaseIngredients(item.recipeId, item.quantity, overrides);
    for (const [id, qty] of resolved) {
      allIngredients.set(id, (allIngredients.get(id) || 0) + qty);
    }
  }

  // Build aggregated ingredient list
  const aggIngredients: AggregatedIngredient[] = [];
  let totalCost: number | null = 0;

  for (const [id, qty] of allIngredients) {
    const ing = ingredients[id];
    const unitCost = ing?.cost ?? null;
    const ingTotalCost = unitCost !== null ? unitCost * qty : null;
    const source = ing?.source ?? 'shop';
    const dailyLimit = ing?.dailyLimit ?? null;
    const daysNeeded = dailyLimit ? Math.ceil(qty / dailyLimit) : null;

    if (ingTotalCost === null) {
      totalCost = null; // Can't compute total if any ingredient cost is unknown
    } else if (totalCost !== null) {
      totalCost += ingTotalCost;
    }

    aggIngredients.push({
      ingredientId: id,
      totalQuantity: qty,
      unitCost,
      totalCost: ingTotalCost,
      source,
      dailyLimit,
      daysNeeded,
    });
  }

  // Sort by source then name
  aggIngredients.sort((a, b) => {
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    const nameA = ingredients[a.ingredientId]?.name ?? a.ingredientId;
    const nameB = ingredients[b.ingredientId]?.name ?? b.ingredientId;
    return nameA.localeCompare(nameB);
  });

  // Calculate total revenue
  let totalRevenue = 0;
  for (const item of items) {
    const recipe = recipes.find((r) => r.id === item.recipeId);
    if (recipe) {
      const sell = getSellPrice(recipe, item.starRating);
      if (sell !== null) {
        totalRevenue += sell * item.quantity;
      }
    }
  }

  // Shopping days = max days needed across all shop ingredients
  const shoppingDays = aggIngredients.reduce((max, ing) => {
    if (ing.source === 'shop' && ing.daysNeeded !== null) {
      return Math.max(max, ing.daysNeeded);
    }
    return max;
  }, 0);

  const totalProfit = totalCost !== null ? totalRevenue - totalCost : null;

  return {
    items,
    ingredients: aggIngredients,
    totalCost,
    totalRevenue,
    totalProfit,
    shoppingDays,
  };
}

// ─── Inventory-Aware Craftability ─────────────────────────────────

/** Resolve a wildcard by picking the option with the most available inventory */
function resolveWildcardForInventory(ingredientId: string, inventory: Record<string, number>): string {
  const ing = ingredients[ingredientId];
  if (!ing?.isWildcard || !ing.wildcardOptions?.length) return ingredientId;

  let best: string | null = null;
  let bestQty = -1;

  for (const optionId of ing.wildcardOptions) {
    const qty = inventory[optionId] ?? 0;
    if (qty > bestQty) {
      bestQty = qty;
      best = optionId;
    }
  }

  return best ?? ingredientId;
}

/** Like resolveBaseIngredients but resolves wildcards by max inventory availability */
export function resolveBaseIngredientsForInventory(
  recipeId: string,
  quantity: number,
  inventory: Record<string, number>,
): Map<string, number> {
  const result = new Map<string, number>();
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return result;

  for (const ri of recipe.ingredients) {
    const effectiveId = resolveWildcardForInventory(ri.ingredientId, inventory);
    const subRecipe = findRecipeForIngredient(effectiveId);
    if (subRecipe) {
      const subIngredients = resolveBaseIngredientsForInventory(subRecipe.id, ri.quantity * quantity, inventory);
      for (const [id, qty] of subIngredients) {
        result.set(id, (result.get(id) || 0) + qty);
      }
    } else {
      result.set(effectiveId, (result.get(effectiveId) || 0) + ri.quantity * quantity);
    }
  }

  return result;
}

/** Compute how many of a recipe can be crafted from the given inventory */
export function computeCraftableCount(recipeId: string, inventory: Record<string, number>): number {
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe || recipe.isTbd || recipe.ingredients.length === 0) return 0;

  const baseNeeded = resolveBaseIngredientsForInventory(recipeId, 1, inventory);
  if (baseNeeded.size === 0) return 0;

  let minCraftable = Infinity;
  for (const [ingredientId, qtyNeeded] of baseNeeded) {
    const available = inventory[ingredientId] ?? 0;
    minCraftable = Math.min(minCraftable, Math.floor(available / qtyNeeded));
  }

  return minCraftable === Infinity ? 0 : minCraftable;
}

// ─── Expected Value (Star Odds) ───────────────────────────────────

export function computeExpectedRevenue(items: BatchItem[], starOdds: StarOdds): number {
  const totalOdds = (Object.values(starOdds) as number[]).reduce((s, n) => s + n, 0);
  if (totalOdds === 0) return 0;

  let expected = 0;
  for (const item of items) {
    const recipe = recipes.find((r) => r.id === item.recipeId);
    if (!recipe || recipe.basePrice === null) continue;

    let weightedPrice = 0;
    for (const star of [1, 2, 3, 4, 5] as StarRating[]) {
      const sell = getSellPrice(recipe, star);
      if (sell !== null) {
        weightedPrice += sell * (starOdds[star] / totalOdds);
      }
    }
    expected += weightedPrice * item.quantity;
  }

  return Math.round(expected);
}
