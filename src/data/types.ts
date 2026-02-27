export type IngredientSource = 'shop' | 'foraged' | 'farmed' | 'fished' | 'special' | 'crafted';

export type RecipeCategory =
  | 'jam'
  | 'sauce'
  | 'grilled'
  | 'pie'
  | 'roll-cake'
  | 'salad'
  | 'seafood'
  | 'pasta'
  | 'pizza'
  | 'soup'
  | 'cake'
  | 'beverage'
  | 'composite'
  | 'burger'
  | 'other'
  | 'failure';

export type UnlockMethod = 'starting' | 'massimo' | 'quest' | 'doris' | 'variant';

export interface Ingredient {
  id: string;
  name: string;
  source: IngredientSource;
  cost: number | null; // null = free or TBD
  dailyLimit: number | null; // null = no limit
  isWildcard?: boolean; // "Any Fish", "Any Fruit", etc.
  wildcardOptions?: string[]; // ingredient IDs that satisfy this wildcard
  notes?: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface StarPrices {
  star1: number | null;
  star2: number | null;
  star3: number | null;
  star4: number | null;
  star5: number | null;
}

export interface Recipe {
  id: string;
  name: string;
  level: number;
  category: RecipeCategory;
  ingredients: RecipeIngredient[];
  costToMake: number | null;
  sellPrices: StarPrices;
  energy: number | null;
  buff?: string;
  unlock: {
    method: UnlockMethod;
    description: string;
    recipeCost?: number; // gold cost to buy recipe from Massimo
  };
  isComposite?: boolean; // uses other recipes as ingredients
  isTbd?: boolean; // incomplete data
  notes?: string;
}

export interface CropData {
  id: string;
  name: string;
  gardeningLevel: number;
  seedCost: number;
  growthTime: string;
  growthMinutes: number;
  sellPrices: StarPrices;
}

export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface BatchItem {
  recipeId: string;
  quantity: number;
  starRating: StarRating;
}

export interface AggregatedIngredient {
  ingredientId: string;
  totalQuantity: number;
  unitCost: number | null;
  totalCost: number | null;
  source: IngredientSource;
  dailyLimit: number | null;
  daysNeeded: number | null;
}

export interface BatchSummary {
  items: BatchItem[];
  ingredients: AggregatedIngredient[];
  totalCost: number | null;
  totalRevenue: number;
  totalProfit: number | null;
  shoppingDays: number;
}

// ─── Farm Planner Types ─────────────────────────────────────────────

export interface FarmCropRequirement {
  ingredientId: string;
  cropId: string;
  cropName: string;
  qtyNeeded: number;
  seedCost: number;
  growthMinutes: number;
  isTbd: boolean;
}

export interface FarmCropAllocation extends FarmCropRequirement {
  plotsAllocated: number;
  cycles: number;
  totalMinutes: number;
  totalSeedCost: number;
  isBottleneck: boolean;
}

export interface FarmSchedulePhase {
  phaseNumber: number;
  startMinute: number;
  endMinute: number;
  plotAssignments: Record<string, number>; // cropId → plot count
  completedCrops: string[]; // cropIds that finish this phase
}

export interface FarmScheduleResult {
  totalPlots: number;
  allocations: FarmCropAllocation[];
  totalFarmingMinutes: number;
  totalSeedCost: number;
  phases: FarmSchedulePhase[];
  hasTbdCrops: boolean;
}

export interface GardenLevelPreset {
  level: number;
  plots: number;
  label: string;
}
