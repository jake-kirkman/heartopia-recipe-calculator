export function formatGold(amount: number | null): string {
  if (amount === null) return 'TBD';
  return amount.toLocaleString() + 'G';
}

export function formatProfit(amount: number | null): string {
  if (amount === null) return 'TBD';
  const sign = amount >= 0 ? '+' : '';
  return sign + amount.toLocaleString() + 'G';
}

export function formatPercent(value: number | null): string {
  if (value === null) return 'TBD';
  return Math.round(value) + '%';
}

export function formatGrowthTime(minutes: number): string {
  if (minutes === 0) return 'TBD';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

export function formatFarmingTime(totalMinutes: number): string {
  if (totalMinutes === 0) return 'TBD';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const mins = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(' ');
}

export function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    jam: 'Jam',
    sauce: 'Sauce',
    grilled: 'Grilled',
    pie: 'Pie',
    'roll-cake': 'Roll Cake',
    salad: 'Salad',
    seafood: 'Seafood',
    pasta: 'Pasta',
    pizza: 'Pizza',
    soup: 'Soup',
    cake: 'Cake',
    beverage: 'Beverage',
    composite: 'Composite',
    burger: 'Burger',
    other: 'Other',
    failure: 'Failure',
    'frostspore-event': 'Frostspore Event',
  };
  return labels[cat] || cat;
}

export function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    shop: 'Shop',
    foraged: 'Foraged',
    farmed: 'Farmed',
    fished: 'Fished',
    special: 'Special',
    crafted: 'Crafted',
  };
  return labels[source] || source;
}
