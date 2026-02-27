import { Link, useLocation } from 'react-router-dom';
import { useBatchPlanner } from '../context/BatchPlannerContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/profit', label: 'Profit Calc' },
  { to: '/ingredients', label: 'Ingredients' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/planner', label: 'Planner' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { items } = useBatchPlanner();
  const plannerCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-peach/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">🍳</span>
            <h1 className="text-lg font-bold text-bark m-0">Heartopia Recipes</h1>
          </Link>
          <nav className="flex gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                    isActive
                      ? 'bg-coral text-white'
                      : 'text-bark hover:bg-peach/50'
                  }`}
                >
                  {link.label}
                  {link.to === '/planner' && plannerCount > 0 && (
                    <span className="ml-1 bg-coral text-white text-xs rounded-full px-1.5 py-0.5 inline-block min-w-[1.25rem] text-center">
                      {plannerCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-peach/30 py-4 text-center text-sm text-wood/60">
        <p>Heartopia Recipe Calculator - Fan-made tool. Not affiliated with the game developers.</p>
      </footer>
    </div>
  );
}
