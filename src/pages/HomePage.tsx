import { Link } from 'react-router-dom';

const features = [
  {
    to: '/recipes',
    title: 'Recipe Browser',
    description: 'Browse all 65 recipes with ingredient details and sell prices',
    icon: '📖',
  },
  {
    to: '/profit',
    title: 'Profit Calculator',
    description: 'Compare recipes by profit and margin at any star rating',
    icon: '💰',
  },
  {
    to: '/ingredients',
    title: 'Ingredient Reference',
    description: 'Shop prices, forage locations, and crop growth times',
    icon: '🥕',
  },
  {
    to: '/inventory',
    title: 'Inventory Checker',
    description: 'Enter your ingredients and see which recipes you can craft',
    icon: '📦',
  },
  {
    to: '/planner',
    title: 'Batch Planner',
    description: 'Plan cooking sessions and calculate shopping lists',
    icon: '📋',
  },
];

const stats = [
  { label: 'Recipes', value: '65' },
  { label: 'Levels', value: '1-13' },
  { label: 'Star Ratings', value: '1-5' },
];

export function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-10">
        <span className="text-5xl block mb-4">🍳</span>
        <h1 className="text-4xl font-bold text-bark mb-3">
          Heartopia Recipe Calculator
        </h1>
        <p className="text-lg text-wood max-w-xl mx-auto">
          Helping players optimize cooking profits — find the best recipes,
          compare margins, and plan your ingredients.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="flex justify-center gap-6 flex-wrap">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white shadow-sm border border-peach/30 px-6 py-4 text-center min-w-[120px]"
          >
            <p className="text-2xl font-bold text-coral">{stat.value}</p>
            <p className="text-sm text-wood">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="rounded-xl bg-white shadow-sm border border-peach/30 p-6 no-underline hover:shadow-md hover:border-coral/40 transition-all group"
          >
            <span className="text-3xl block mb-3">{feature.icon}</span>
            <h2 className="text-lg font-bold text-bark mb-1 group-hover:text-coral transition-colors">
              {feature.title}
            </h2>
            <p className="text-sm text-wood leading-relaxed">
              {feature.description}
            </p>
            <span className="inline-block mt-3 bg-coral text-white text-sm font-medium rounded-lg px-4 py-1.5">
              Open
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
