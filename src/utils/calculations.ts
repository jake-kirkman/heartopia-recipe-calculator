import type { StarRating, Recipe, BatchItem, AggregatedIngredient, BatchSummary } from '../data/types';
import { ingredients } from '../data/ingredients';
import { recipes } from '../data/recipes';
import { STAR_MULTIPLIERS } from '../data/constants';

export function getSellPrice(recipe: Recipe, star: StarRating): number | null {
  if (recipe.basePrice === null) return null;
  return Math.round(recipe.basePrice * STAR_MULTIPLIERS[star]);
}

export function getProfit(recipe: Recipe, star: StarRating): number | null {
  const sell = getSellPrice(recipe, star);
  if (sell === null || recipe.costToMake === null) return null;
  return sell - recipe.costToMake;
}

export function getMargin(recipe: Recipe, star: StarRating): number | null {
  const sell = getSellPrice(recipe, star);
  const profit = getProfit(recipe, star);
  if (sell === null || profit === null || sell === 0) return null;
  return (profit / sell) * 100;
}

/** Resolve a recipe-as-ingredient to its base recipe */
function findRecipeForIngredient(ingredientId: string): Recipe | undefined {
  if (!ingredientId.startsWith('recipe-')) return undefined;
  const recipeId = ingredientId.slice('recipe-'.length);
  return recipes.find((r) => r.id === recipeId);
}

/** Recursively resolve composite recipes to base ingredients */
export function resolveBaseIngredients(
  recipeId: string,
  quantity: number
): Map<string, number> {
  const result = new Map<string, number>();
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return result;

  for (const ri of recipe.ingredients) {
    const subRecipe = findRecipeForIngredient(ri.ingredientId);
    if (subRecipe) {
      // This ingredient is itself a recipe - recurse
      const subIngredients = resolveBaseIngredients(subRecipe.id, ri.quantity * quantity);
      for (const [id, qty] of subIngredients) {
        result.set(id, (result.get(id) || 0) + qty);
      }
    } else {
      // Base ingredient
      result.set(ri.ingredientId, (result.get(ri.ingredientId) || 0) + ri.quantity * quantity);
    }
  }

  return result;
}

export function computeBatchSummary(items: BatchItem[]): BatchSummary {
  const allIngredients = new Map<string, number>();

  // Aggregate all base ingredients across all batch items
  for (const item of items) {
    const resolved = resolveBaseIngredients(item.recipeId, item.quantity);
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
