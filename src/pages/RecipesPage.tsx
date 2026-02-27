import { useState } from 'react';
import { recipes } from '../data/recipes';
import type { Recipe, StarRating as StarRatingType } from '../data/types';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeFilterControls } from '../components/RecipeFilterControls';
import { RecipeModal } from '../components/RecipeModal';
import { useRecipeFilters } from '../hooks/useRecipeFilters';
import { useBatchPlanner } from '../context/BatchPlannerContext';

export function RecipesPage() {
  const { addItem } = useBatchPlanner();
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
