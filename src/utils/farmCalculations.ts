import type {
  AggregatedIngredient,
  FarmCropRequirement,
  FarmCropAllocation,
  FarmSchedulePhase,
  FarmScheduleResult,
} from '../data/types';
import { ingredients } from '../data/ingredients';
import { INGREDIENT_TO_CROP_ID, cropsById } from '../data/crops';

/**
 * Filter aggregated ingredients to farmed-only (non-wildcard) and map to crop data.
 */
export function extractFarmRequirements(
  batchIngredients: AggregatedIngredient[],
): FarmCropRequirement[] {
  const reqs: FarmCropRequirement[] = [];

  for (const ing of batchIngredients) {
    if (ing.source !== 'farmed') continue;

    const ingData = ingredients[ing.ingredientId];
    if (ingData?.isWildcard) continue;

    const cropId = INGREDIENT_TO_CROP_ID[ing.ingredientId];
    if (!cropId) continue;

    const crop = cropsById[cropId];
    if (!crop) continue;

    reqs.push({
      ingredientId: ing.ingredientId,
      cropId: crop.id,
      cropName: crop.name,
      qtyNeeded: ing.totalQuantity,
      seedCost: crop.seedCost,
      growthMinutes: crop.growthMinutes,
      isTbd: crop.growthMinutes === 0,
    });
  }

  return reqs;
}

/**
 * Compute farm schedule using greedy fastest-first strategy.
 */
export function computeFarmSchedule(
  batchIngredients: AggregatedIngredient[],
  totalPlots: number,
): FarmScheduleResult {
  const requirements = extractFarmRequirements(batchIngredients);
  const schedulable = requirements.filter((r) => !r.isTbd);
  const hasTbdCrops = requirements.some((r) => r.isTbd);

  if (schedulable.length === 0) {
    return {
      totalPlots,
      allocations: requirements.map((r) => ({
        ...r,
        plotsAllocated: 0,
        cycles: 0,
        totalMinutes: 0,
        totalSeedCost: r.qtyNeeded * r.seedCost,
        isBottleneck: false,
      })),
      totalFarmingMinutes: 0,
      totalSeedCost: requirements.reduce((sum, r) => sum + r.qtyNeeded * r.seedCost, 0),
      phases: [],
      hasTbdCrops,
    };
  }

  const result = computeFastestFirst(requirements, schedulable, totalPlots);
  result.hasTbdCrops = hasTbdCrops;
  return result;
}

function computeFastestFirst(
  allReqs: FarmCropRequirement[],
  schedulable: FarmCropRequirement[],
  totalPlots: number,
): FarmScheduleResult {
  // Sort by growth time ascending — fastest crops get plot priority
  const sorted = [...schedulable].sort((a, b) => a.growthMinutes - b.growthMinutes);

  interface CropState {
    req: FarmCropRequirement;
    remaining: number;
  }

  let queue: CropState[] = sorted.map((req) => ({
    req,
    remaining: req.qtyNeeded,
  }));

  const phases: FarmSchedulePhase[] = [];
  // Track per-crop info across multiple phases
  const cropInfo: Record<string, { initialPlots: number; phaseCount: number; growthMinutes: number }> = {};
  let currentMinute = 0;

  // Each iteration is one phase = exactly one growth cycle
  while (queue.length > 0) {
    let available = totalPlots;
    const roundCrops: { state: CropState; plots: number }[] = [];

    for (const state of queue) {
      const plots = Math.min(state.remaining, available);
      if (plots <= 0) continue;
      available -= plots;
      roundCrops.push({ state, plots });
    }

    if (roundCrops.length === 0) break;

    // Phase duration = one cycle of the slowest crop planted this phase
    const phaseDuration = Math.max(...roundCrops.map((rc) => rc.state.req.growthMinutes));

    const phaseAssignments: Record<string, number> = {};
    const completedCrops: string[] = [];

    for (const rc of roundCrops) {
      const cropId = rc.state.req.cropId;
      phaseAssignments[cropId] = rc.plots;

      // Harvest exactly one cycle worth
      rc.state.remaining -= rc.plots;

      // Track per-crop info: initialPlots from first phase, count all phases
      if (!cropInfo[cropId]) {
        cropInfo[cropId] = {
          initialPlots: rc.plots,
          phaseCount: 1,
          growthMinutes: rc.state.req.growthMinutes,
        };
      } else {
        cropInfo[cropId].phaseCount += 1;
      }

      if (rc.state.remaining <= 0) {
        completedCrops.push(cropId);
      }
    }

    phases.push({
      phaseNumber: phases.length + 1,
      startMinute: currentMinute,
      endMinute: currentMinute + phaseDuration,
      plotAssignments: phaseAssignments,
      completedCrops,
    });

    currentMinute += phaseDuration;
    queue = queue.filter((c) => c.remaining > 0);
  }

  // Build allocations
  const allocations: FarmCropAllocation[] = schedulable.map((req) => {
    const info = cropInfo[req.cropId];
    if (!info) {
      return {
        ...req,
        plotsAllocated: 0,
        cycles: 0,
        totalMinutes: 0,
        totalSeedCost: req.qtyNeeded * req.seedCost,
        isBottleneck: false,
      };
    }
    return {
      ...req,
      plotsAllocated: info.initialPlots,
      cycles: info.phaseCount,
      totalMinutes: info.phaseCount * info.growthMinutes,
      totalSeedCost: req.qtyNeeded * req.seedCost,
      isBottleneck: false,
    };
  });

  // Add TBD crops
  for (const req of allReqs) {
    if (!req.isTbd) continue;
    allocations.push({
      ...req,
      plotsAllocated: 0,
      cycles: 0,
      totalMinutes: 0,
      totalSeedCost: req.qtyNeeded * req.seedCost,
      isBottleneck: false,
    });
  }

  // Mark bottleneck
  const maxTime = Math.max(...allocations.map((a) => a.totalMinutes));
  for (const a of allocations) {
    a.isBottleneck = a.totalMinutes === maxTime && maxTime > 0;
  }

  return {
    totalPlots,
    allocations,
    totalFarmingMinutes: currentMinute,
    totalSeedCost: allocations.reduce((sum, a) => sum + a.totalSeedCost, 0),
    phases,
    hasTbdCrops: false,
  };
}
