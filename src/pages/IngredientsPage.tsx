import { useState } from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ingredients } from '../data/ingredients';
import { crops, INGREDIENT_TO_CROP_ID } from '../data/crops';
import type { Ingredient } from '../data/types';
import { formatGold } from '../utils/formatters';
import { Badge, TbdBadge } from '../components/Badge';

const CROP_TO_INGREDIENT: Record<string, string> = {};
for (const [ingId, cropId] of Object.entries(INGREDIENT_TO_CROP_ID)) {
  CROP_TO_INGREDIENT[cropId] = ingId;
}

type TabKey = 'shop' | 'foraged' | 'farmed' | 'fished' | 'special';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'shop', label: 'Shop' },
  { key: 'foraged', label: 'Foraged' },
  { key: 'farmed', label: 'Farmed' },
  { key: 'fished', label: 'Fished' },
  { key: 'special', label: 'Special' },
];

function bySource(source: string): Ingredient[] {
  return Object.values(ingredients).filter(
    (i) => i.source === source && !i.isWildcard
  );
}

// ---------------------------------------------------------------------------
// Shop Tab
// ---------------------------------------------------------------------------

function ShopTable() {
  const items = bySource('shop');

  return (
    <div className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-clip">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Ingredient</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Cost</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Daily Limit</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-peach/20">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-cream/40 transition-colors">
              <td className="px-4 py-3 font-medium text-bark">
                {item.emoji && <span className="mr-1.5">{item.emoji}</span>}
                {item.name}
              </td>
              <td className="px-4 py-3 text-bark">
                {item.cost !== null ? (
                  <Badge variant="coral">{formatGold(item.cost)}</Badge>
                ) : (
                  <TbdBadge />
                )}
              </td>
              <td className="px-4 py-3 text-wood">
                {item.dailyLimit !== null ? `${item.dailyLimit}/day` : '--'}
              </td>
              <td className="px-4 py-3 text-wood text-xs">
                {item.notes ?? '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Foraged Tab
// ---------------------------------------------------------------------------

function ForagedGrid() {
  const items = bySource('foraged');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl bg-white shadow-sm border border-peach/30 p-4 flex flex-col items-center gap-2 text-center"
        >
          {item.emoji && <span className="text-2xl">{item.emoji}</span>}
          <span className="font-medium text-bark">{item.name}</span>
          <Badge variant="sage">Free</Badge>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Farmed Tab (Crop Data)
// ---------------------------------------------------------------------------

function FarmedTable() {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-clip">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Crop</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Gardening Lvl</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Seed Cost</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Growth Time</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">1-Star Sell</th>
            <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-peach/20">
          {crops.map((crop) => {
            const sell1 = crop.sellPrice;
            const profit =
              sell1 !== null ? sell1 - crop.seedCost : null;

            return (
              <tr
                key={crop.id}
                className="hover:bg-cream/40 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-bark">
                  {(() => { const ing = ingredients[CROP_TO_INGREDIENT[crop.id]]; return ing?.emoji ? <span className="mr-1.5">{ing.emoji}</span> : null; })()}
                  {crop.name}
                </td>
                <td className="px-4 py-3 text-wood">{crop.gardeningLevel}</td>
                <td className="px-4 py-3 text-bark">
                  <Badge variant="coral">{formatGold(crop.seedCost)}</Badge>
                </td>
                <td className="px-4 py-3">
                  {crop.growthTime === 'TBD' ? (
                    <TbdBadge />
                  ) : (
                    <Badge variant="sky">{crop.growthTime}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-bark">
                  {sell1 !== null ? formatGold(sell1) : <TbdBadge />}
                </td>
                <td className="px-4 py-3">
                  {profit !== null ? (
                    <span
                      className={
                        profit >= 0 ? 'text-sage font-semibold' : 'text-coral font-semibold'
                      }
                    >
                      {profit >= 0 ? '+' : ''}
                      {formatGold(profit)}
                    </span>
                  ) : (
                    <TbdBadge />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fished Tab
// ---------------------------------------------------------------------------

function FishedList() {
  const items = bySource('fished');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl bg-white shadow-sm border border-peach/30 p-4 flex flex-col items-center gap-2 text-center"
        >
          {item.emoji && <span className="text-2xl">{item.emoji}</span>}
          <span className="font-medium text-bark">{item.name}</span>
          <Badge variant="sky">Free</Badge>
          {item.notes && (
            <span className="text-xs text-wood">{item.notes}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Special Tab (Doris)
// ---------------------------------------------------------------------------

function SpecialTable() {
  const items = bySource('special');

  return (
    <div className="space-y-4">
      <p className="text-sm text-wood">
        These colored sugars are purchased from{' '}
        <span className="font-semibold text-bark">Doris</span>, the special
        merchant. Prices and availability details are still being confirmed.
      </p>
      <div className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-clip">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Ingredient</th>
              <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Cost</th>
              <th className="px-4 py-3 font-semibold text-bark sticky top-[57px] z-20 bg-cream border-b border-peach/30">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-peach/20">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-cream/40 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-bark">
                  {item.emoji && <span className="mr-1.5">{item.emoji}</span>}
                  {item.name}
                </td>
                <td className="px-4 py-3">
                  {item.cost !== null ? (
                    <Badge variant="coral">{formatGold(item.cost)}</Badge>
                  ) : (
                    <TbdBadge />
                  )}
                </td>
                <td className="px-4 py-3 text-wood text-xs">
                  {item.notes ?? '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export function IngredientsPage() {
  useDocumentMeta({
    title: 'Ingredient Reference',
    description: 'Complete Heartopia ingredient guide. Shop prices and daily limits, foraged item locations, crop growth times and seed costs, fish, and special merchant goods from Doris.',
  });

  const [activeTab, setActiveTab] = useState<TabKey>('shop');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-bark mb-1">
          Ingredient Reference
        </h1>
        <p className="text-wood">
          Browse all ingredients by source — shop prices, foraged items, crop
          data, fish, and special merchant goods.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-coral text-white'
                : 'text-bark hover:bg-peach/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'shop' && <ShopTable />}
        {activeTab === 'foraged' && <ForagedGrid />}
        {activeTab === 'farmed' && <FarmedTable />}
        {activeTab === 'fished' && <FishedList />}
        {activeTab === 'special' && <SpecialTable />}
      </div>
    </div>
  );
}
