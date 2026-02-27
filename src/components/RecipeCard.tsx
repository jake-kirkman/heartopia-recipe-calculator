import type { ReactNode } from 'react';
import type { Recipe, StarRating as StarRatingType } from '../data/types';
import { categoryColor } from '../data/recipeConstants';
import { ingredients } from '../data/ingredients';
import { getSellPrice, getProfit } from '../utils/calculations';
import { formatGold, formatProfit, categoryLabel } from '../utils/formatters';
import { Badge, TbdBadge } from './Badge';

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

interface RecipeCardProps {
  recipe: Recipe;
  star: StarRatingType;
  onOpen: () => void;
  onAdd: () => void;
  extraInfo?: ReactNode;
}

export function RecipeCard({ recipe, star, onOpen, onAdd, extraInfo }: RecipeCardProps) {
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

      {/* Extra info slot (e.g. craftable count badge) */}
      {extraInfo}

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
