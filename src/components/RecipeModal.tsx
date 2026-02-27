import { useState } from 'react';
import { recipes } from '../data/recipes';
import { ingredients } from '../data/ingredients';
import type { Recipe, StarRating as StarRatingType } from '../data/types';
import { categoryColor } from '../data/recipeConstants';
import { getSellPrice, getProfit, computeCostToMake } from '../utils/calculations';
import { formatGold, formatProfit, categoryLabel } from '../utils/formatters';
import { Badge, TbdBadge } from './Badge';

function findSubRecipe(ingredientId: string): Recipe | undefined {
  if (!ingredientId.startsWith('recipe-')) return undefined;
  return recipes.find((r) => r.id === ingredientId.slice('recipe-'.length));
}

function ingredientCost(ingredientId: string): number | null {
  const subRecipe = findSubRecipe(ingredientId);
  if (subRecipe) return computeCostToMake(subRecipe);
  return ingredients[ingredientId]?.cost ?? null;
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

export function RecipeModal({
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
                  <td className="pt-1 text-right">{formatGold(computeCostToMake(recipe))}</td>
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
