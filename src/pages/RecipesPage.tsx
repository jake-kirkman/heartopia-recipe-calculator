import { useState } from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { recipes } from '../data/recipes';
import type { Recipe, StarRating as StarRatingType } from '../data/types';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeFilterControls } from '../components/RecipeFilterControls';
import { RecipeModal } from '../components/RecipeModal';
import { useRecipeFilters } from '../hooks/useRecipeFilters';
import { useBatchPlanner } from '../context/BatchPlannerContext';

export function RecipesPage() {
  useDocumentMeta({
    title: 'Recipe Browser',
    description: 'Browse all 65+ Heartopia cooking recipes with ingredient details, sell prices, star ratings, and unlock requirements. Filter by level, category, and more.',
  });

  const { items, addItem, decrementItem } = useBatchPlanner();
  const [star, setStar] = useState<StarRatingType>(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

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
  } = useRecipeFilters({ recipes, star });

  const handleAdd = (recipeId: string) => {
    addItem(recipeId, 1, star);
  };

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
      />

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-wood">No recipes match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((recipe) => {
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
              />
            );
          })}
        </div>
      )}

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
