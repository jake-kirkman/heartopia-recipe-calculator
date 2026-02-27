import { useState, useMemo, useRef } from 'react';
import type { AggregatedIngredient } from '../data/types';
import { GARDEN_LEVEL_PRESETS, DEFAULT_GARDEN_PLOTS } from '../data/constants';
import { computeFarmSchedule } from '../utils/farmCalculations';
import { formatGold, formatFarmingTime } from '../utils/formatters';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { NumberInput } from './NumberInput';
import { Badge } from './Badge';

const CROP_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  tomato: { bg: 'bg-red-400', border: 'border-red-500', text: 'text-red-700', label: 'Tomato' },
  potato: { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-700', label: 'Potato' },
  wheat: { bg: 'bg-yellow-300', border: 'border-yellow-400', text: 'text-yellow-700', label: 'Wheat' },
  lettuce: { bg: 'bg-green-400', border: 'border-green-500', text: 'text-green-700', label: 'Lettuce' },
  pineapple: { bg: 'bg-lime-400', border: 'border-lime-500', text: 'text-lime-700', label: 'Pineapple' },
  carrot: { bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-orange-700', label: 'Carrot' },
  strawberry: { bg: 'bg-pink-400', border: 'border-pink-500', text: 'text-pink-700', label: 'Strawberry' },
  corn: { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-800', label: 'Corn' },
  grape: { bg: 'bg-purple-400', border: 'border-purple-500', text: 'text-purple-700', label: 'Grape' },
  eggplant: { bg: 'bg-violet-400', border: 'border-violet-500', text: 'text-violet-700', label: 'Eggplant' },
  'tea-tree': { bg: 'bg-emerald-400', border: 'border-emerald-500', text: 'text-emerald-700', label: 'Tea Tree' },
  'cacao-tree': { bg: 'bg-amber-700', border: 'border-amber-800', text: 'text-amber-900', label: 'Cacao Tree' },
  avocado: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-green-800', label: 'Avocado' },
};

const DEFAULT_CROP_COLOR = { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-gray-700', label: '?' };

/** Format a time offset as "HH:mm" with a "+N day" prefix when it rolls past midnight */
function formatPhaseTime(startTimeStr: string, offsetMinutes: number): string {
  const [h, m] = startTimeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + offsetMinutes;
  const days = Math.floor(totalMinutes / 1440);
  const remaining = ((totalMinutes % 1440) + 1440) % 1440; // handle negatives safely
  const hh = String(Math.floor(remaining / 60)).padStart(2, '0');
  const mm = String(remaining % 60).padStart(2, '0');
  const dayPrefix = days > 0 ? `+${days} day${days > 1 ? 's' : ''} ` : '';
  return `${dayPrefix}${hh}:${mm}`;
}

interface FarmPlannerProps {
  farmedIngredients: AggregatedIngredient[];
}

export function FarmPlanner({ farmedIngredients }: FarmPlannerProps) {
  const [gardenLevel, setGardenLevel] = useLocalStorage<number>('farm-garden-level', 1);
  const [plotCount, setPlotCount] = useLocalStorage<number>('farm-plot-count', DEFAULT_GARDEN_PLOTS);
  const [gridExpanded, setGridExpanded] = useState(false);
  const [startTimeOfDay, setStartTimeOfDay] = useState<string>('');
  const timeRef = useRef<HTMLInputElement>(null);

  const schedule = useMemo(
    () => computeFarmSchedule(farmedIngredients, plotCount),
    [farmedIngredients, plotCount],
  );

  const handleGardenLevelChange = (level: number) => {
    setGardenLevel(level);
    const preset = GARDEN_LEVEL_PRESETS.find((p) => p.level === level);
    if (preset) setPlotCount(preset.plots);
  };

  // Check for wildcards in farmed ingredients
  const hasWildcards = farmedIngredients.some((ing) => {
    // Wildcards like any-vegetable have source=farmed
    return ing.ingredientId.startsWith('any-');
  });

  // Crops used in this schedule (for legend)
  const usedCropIds = schedule.allocations
    .filter((a) => !a.isTbd)
    .map((a) => a.cropId);

  return (
    <section className="rounded-xl bg-white shadow-sm border-2 border-sage/40 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-sage/20 bg-sage/10 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-bark">Farm Planner</h2>
        {schedule.totalFarmingMinutes > 0 && (
          <Badge variant="sage">{formatFarmingTime(schedule.totalFarmingMinutes)}</Badge>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Garden Level */}
          <div>
            <label className="block text-xs font-semibold text-wood mb-1">Garden Level</label>
            <select
              value={gardenLevel}
              onChange={(e) => handleGardenLevelChange(Number(e.target.value))}
              className="rounded-lg border border-sage/50 bg-white px-3 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-sage/40"
            >
              {GARDEN_LEVEL_PRESETS.map((p) => (
                <option key={p.level} value={p.level}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Plot Count */}
          <div>
            <label className="block text-xs font-semibold text-wood mb-1">Plot Count</label>
            <NumberInput value={plotCount} onChange={setPlotCount} min={1} max={40} />
          </div>

        </div>

        {/* TBD Warning */}
        {schedule.hasTbdCrops && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2 text-sm text-yellow-800">
            Some crops have unknown growth times (TBD). They are excluded from scheduling but seed costs are included.
          </div>
        )}

        {/* Wildcard note */}
        {hasWildcards && (
          <div className="rounded-lg bg-sage/10 border border-sage/20 px-4 py-2 text-sm text-wood">
            Wildcard ingredients (e.g. Any Vegetable) are not included in farm scheduling.
          </div>
        )}

        {/* More crop types than plots warning */}
        {usedCropIds.length > plotCount && (
          <div className="rounded-lg bg-coral/10 border border-coral/30 px-4 py-2 text-sm text-coral">
            You have {usedCropIds.length} crop types but only {plotCount} plot{plotCount !== 1 ? 's' : ''}. Some crops may not grow efficiently.
          </div>
        )}

        {/* Crop Allocation Table */}
        {schedule.allocations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage/20 text-left text-wood">
                  <th className="px-3 py-2 font-semibold">Crop</th>
                  <th className="px-3 py-2 font-semibold text-right">Qty</th>
                  <th className="px-3 py-2 font-semibold text-right">Seed Cost</th>
                  <th className="px-3 py-2 font-semibold text-right">Growth</th>
                  <th className="px-3 py-2 font-semibold text-right">Plots</th>
                  <th className="px-3 py-2 font-semibold text-right">Cycles</th>
                  <th className="px-3 py-2 font-semibold text-right">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {schedule.allocations.map((alloc) => {
                  const color = CROP_COLORS[alloc.cropId] ?? DEFAULT_CROP_COLOR;
                  return (
                    <tr
                      key={alloc.cropId}
                      className={`border-b border-sage/10 transition-colors ${
                        alloc.isBottleneck ? 'bg-sage/15' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-bark">
                        <span className="flex items-center gap-2">
                          <span className={`inline-block w-3 h-3 rounded-sm ${color.bg}`} />
                          {alloc.cropName}
                          {alloc.isBottleneck && <span className="text-xs text-sage font-bold">BOTTLENECK</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-bark">{alloc.qtyNeeded}</td>
                      <td className="px-3 py-2 text-right text-wood">{formatGold(alloc.totalSeedCost)}</td>
                      <td className="px-3 py-2 text-right text-wood">
                        {alloc.isTbd ? 'TBD' : formatFarmingTime(alloc.growthMinutes)}
                      </td>
                      <td className="px-3 py-2 text-right text-bark">
                        {alloc.isTbd ? '-' : alloc.plotsAllocated}
                      </td>
                      <td className="px-3 py-2 text-right text-bark">
                        {alloc.isTbd ? '-' : alloc.cycles}
                      </td>
                      <td className={`px-3 py-2 text-right font-semibold ${alloc.isBottleneck ? 'text-sage' : 'text-bark'}`}>
                        {alloc.isTbd ? 'TBD' : formatFarmingTime(alloc.totalMinutes)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Plot Allocation Grid (collapsible) */}
        {schedule.phases.length > 0 && (
          <div>
            <button
              onClick={() => setGridExpanded(!gridExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-wood hover:text-bark cursor-pointer bg-transparent border-none p-0 transition-colors"
            >
              <span className={`inline-block transition-transform ${gridExpanded ? 'rotate-90' : ''}`}>
                &#9654;
              </span>
              Plot Allocation Grid ({schedule.phases.length} {schedule.phases.length === 1 ? 'phase' : 'phases'})
            </button>

            {gridExpanded && (
              <div className="mt-3 space-y-3">
                {/* Start Time input */}
                <div className="rounded-lg bg-cream/60 border border-sage/20 px-4 py-3 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-wood whitespace-nowrap">Start Time</span>

                  <div
                    onClick={() => timeRef.current?.showPicker?.()}
                    className="relative flex items-center gap-2 rounded-lg border border-sage/50 bg-white pl-2.5 pr-1 py-1.5 cursor-pointer hover:border-sage transition-colors focus-within:ring-2 focus-within:ring-sage/40"
                  >
                    <svg className="w-4 h-4 text-wood/50 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <input
                      ref={timeRef}
                      type="time"
                      value={startTimeOfDay}
                      onChange={(e) => setStartTimeOfDay(e.target.value)}
                      className="text-sm text-bark bg-transparent border-none outline-none cursor-pointer w-[5rem] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>

                  {startTimeOfDay ? (
                    <button
                      onClick={() => setStartTimeOfDay('')}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border-none cursor-pointer bg-coral/20 text-coral hover:bg-coral/30 transition-colors"
                    >
                      Clear
                    </button>
                  ) : (
                    <span className="text-xs text-wood/60 italic">Set a start time to see clock times on each phase</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {schedule.phases.map((phase) => {
                    const usedPlots = Object.values(phase.plotAssignments).reduce((s, n) => s + n, 0);
                    const emptyPlots = schedule.totalPlots - usedPlots;
                    return (
                      <div
                        key={phase.phaseNumber}
                        className="basis-[calc(33.333%-0.5rem)] rounded-lg border border-sage/30 p-3 bg-sage/5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-wood">
                            Phase {phase.phaseNumber}
                          </p>
                          <span className="text-[10px] text-wood/60">
                            {formatFarmingTime(phase.startMinute)} &ndash; {formatFarmingTime(phase.endMinute)}
                          </span>
                        </div>
                        {startTimeOfDay && (
                          <div className="mb-2 px-2 py-1 rounded-md bg-sky/15 text-xs font-semibold text-bark/80 text-center">
                            {formatPhaseTime(startTimeOfDay, phase.startMinute)}
                          </div>
                        )}
                        {!startTimeOfDay && <div className="mb-2" />}
                        <div className="flex flex-wrap justify-center gap-1">
                          {Object.entries(phase.plotAssignments).flatMap(([cropId, count]) => {
                            const color = CROP_COLORS[cropId] ?? DEFAULT_CROP_COLOR;
                            return Array.from({ length: count }, (_, i) => (
                              <div
                                key={`${cropId}-${i}`}
                                className={`w-8 h-8 rounded-sm ${color.bg} border ${color.border}`}
                                title={color.label}
                              />
                            ));
                          })}
                          {Array.from({ length: emptyPlots }, (_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="w-8 h-8 rounded-sm border border-dashed border-gray-300 bg-gray-50"
                              title="Empty"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-sage/20">
                  {usedCropIds.map((cropId) => {
                    const color = CROP_COLORS[cropId] ?? DEFAULT_CROP_COLOR;
                    return (
                      <span key={cropId} className="flex items-center gap-1.5 text-xs text-wood">
                        <span className={`inline-block w-3 h-3 rounded-sm ${color.bg}`} />
                        {color.label}
                      </span>
                    );
                  })}
                  <span className="flex items-center gap-1.5 text-xs text-wood">
                    <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-gray-300 bg-gray-50" />
                    Empty
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-sage/20 bg-sage/5 flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-wood">
          Total Seed Cost: <span className="font-semibold text-bark">{formatGold(schedule.totalSeedCost)}</span>
        </span>
        <span className="text-sm text-wood">
          Total Farming Time:{' '}
          <span className="font-semibold text-bark">
            {schedule.totalFarmingMinutes > 0 ? formatFarmingTime(schedule.totalFarmingMinutes) : 'TBD'}
          </span>
        </span>
      </div>
    </section>
  );
}
