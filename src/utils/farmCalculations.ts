import type {
  AggregatedIngredient,
  FarmCropRequirement,
  FarmCropAllocation,
  FarmSchedulePhase,
  FarmScheduleResult,
  FarmStrategy,
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
 * Compute farm schedule based on strategy.
 */
export function computeFarmSchedule(
  batchIngredients: AggregatedIngredient[],
  totalPlots: number,
  strategy: FarmStrategy,
): FarmScheduleResult {
  const requirements = extractFarmRequirements(batchIngredients);
  const schedulable = requirements.filter((r) => !r.isTbd);
  const hasTbdCrops = requirements.some((r) => r.isTbd);

  if (schedulable.length === 0) {
    return {
      strategy,
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

  let result: FarmScheduleResult;

  switch (strategy) {
    case 'sequential':
      result = computeSequential(requirements, schedulable, totalPlots);
      break;
    case 'equal-split':
      result = computeEqualSplit(requirements, schedulable, totalPlots);
      break;
    case 'fastest-first':
      result = computeFastestFirst(requirements, schedulable, totalPlots);
      break;
  }

  result.hasTbdCrops = hasTbdCrops;
  return result;
}

function computeSequential(
  allReqs: FarmCropRequirement[],
  schedulable: FarmCropRequirement[],
  totalPlots: number,
): FarmScheduleResult {
  // Sort by growth time ascending (fastest crops first)
  const sorted = [...schedulable].sort((a, b) => a.growthMinutes - b.growthMinutes);

  const allocations: FarmCropAllocation[] = [];
  const phases: FarmSchedulePhase[] = [];
  let currentMinute = 0;

  for (const req of sorted) {
    const plotsAllocated = Math.min(req.qtyNeeded, totalPlots);
    const cycles = Math.ceil(req.qtyNeeded / plotsAllocated);
    const cropTime = cycles * req.growthMinutes;

    allocations.push({
      ...req,
      plotsAllocated,
      cycles,
      totalMinutes: cropTime,
      totalSeedCost: req.qtyNeeded * req.seedCost,
      isBottleneck: false,
    });

    phases.push({
      phaseNumber: phases.length + 1,
      startMinute: currentMinute,
      endMinute: currentMinute + cropTime,
      plotAssignments: { [req.cropId]: plotsAllocated },
      completedCrops: [req.cropId],
    });

    currentMinute += cropTime;
  }

  // Add TBD crops as zero-time allocations
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

  const totalFarmingMinutes = currentMinute;

  // Mark the bottleneck (longest single crop time)
  let maxTime = 0;
  for (const a of allocations) {
    if (a.totalMinutes > maxTime) maxTime = a.totalMinutes;
  }
  for (const a of allocations) {
    a.isBottleneck = a.totalMinutes === maxTime && maxTime > 0;
  }

  return {
    strategy: 'sequential',
    totalPlots,
    allocations,
    totalFarmingMinutes,
    totalSeedCost: allocations.reduce((sum, a) => sum + a.totalSeedCost, 0),
    phases,
    hasTbdCrops: false,
  };
}

function computeEqualSplit(
  allReqs: FarmCropRequirement[],
  schedulable: FarmCropRequirement[],
  totalPlots: number,
): FarmScheduleResult {
  const numCrops = schedulable.length;
  const basePlots = Math.floor(totalPlots / numCrops);
  let remainder = totalPlots - basePlots * numCrops;

  // Sort by qty descending to give remainder to neediest
  const sorted = [...schedulable].sort((a, b) => b.qtyNeeded - a.qtyNeeded);

  // Initial allocation with remainder distribution
  const plotAllocs: { req: FarmCropRequirement; plots: number }[] = [];
  for (const req of sorted) {
    const plots = basePlots + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    plotAllocs.push({ req, plots: Math.max(1, plots) });
  }

  // Cap at qtyNeeded and redistribute surplus
  let surplus = 0;
  for (const pa of plotAllocs) {
    if (pa.plots > pa.req.qtyNeeded) {
      surplus += pa.plots - pa.req.qtyNeeded;
      pa.plots = pa.req.qtyNeeded;
    }
  }
  // Redistribute surplus to under-served crops
  while (surplus > 0) {
    let distributed = false;
    for (const pa of plotAllocs) {
      if (surplus <= 0) break;
      if (pa.plots < pa.req.qtyNeeded) {
        pa.plots++;
        surplus--;
        distributed = true;
      }
    }
    if (!distributed) break; // All crops fully served or no room
  }

  const allocations: FarmCropAllocation[] = [];
  const phaseAssignments: Record<string, number> = {};

  for (const pa of plotAllocs) {
    const cycles = Math.ceil(pa.req.qtyNeeded / pa.plots);
    const cropTime = cycles * pa.req.growthMinutes;

    allocations.push({
      ...pa.req,
      plotsAllocated: pa.plots,
      cycles,
      totalMinutes: cropTime,
      totalSeedCost: pa.req.qtyNeeded * pa.req.seedCost,
      isBottleneck: false,
    });

    phaseAssignments[pa.req.cropId] = pa.plots;
  }

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

  const totalFarmingMinutes = Math.max(...allocations.map((a) => a.totalMinutes));

  // Mark bottleneck
  for (const a of allocations) {
    a.isBottleneck = a.totalMinutes === totalFarmingMinutes && totalFarmingMinutes > 0;
  }

  const phases: FarmSchedulePhase[] =
    totalFarmingMinutes > 0
      ? [
          {
            phaseNumber: 1,
            startMinute: 0,
            endMinute: totalFarmingMinutes,
            plotAssignments: phaseAssignments,
            completedCrops: schedulable.map((r) => r.cropId),
          },
        ]
      : [];

  return {
    strategy: 'equal-split',
    totalPlots,
    allocations,
    totalFarmingMinutes,
    totalSeedCost: allocations.reduce((sum, a) => sum + a.totalSeedCost, 0),
    phases,
    hasTbdCrops: false,
  };
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
    strategy: 'fastest-first',
    totalPlots,
    allocations,
    totalFarmingMinutes: currentMinute,
    totalSeedCost: allocations.reduce((sum, a) => sum + a.totalSeedCost, 0),
    phases,
    hasTbdCrops: false,
  };
}
