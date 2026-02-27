import { useState, useEffect } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-peach/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">🍳</span>
            <h1 className="text-lg font-bold text-bark m-0">Heartopia Recipes</h1>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
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

          {/* Hamburger button */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-peach/50 transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="block w-5 h-0.5 bg-bark rounded-full" />
            <span className="block w-5 h-0.5 bg-bark rounded-full mt-1" />
            <span className="block w-5 h-0.5 bg-bark rounded-full mt-1" />
          </button>
        </div>
      </header>

      {/* Mobile side panel */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute top-0 right-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-peach/50">
              <span className="text-lg font-bold text-bark">Menu</span>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-peach/50 transition-colors text-bark text-xl"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col py-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`px-4 py-3 text-base font-medium no-underline transition-colors ${
                      isActive
                        ? 'bg-coral/10 text-coral'
                        : 'text-bark hover:bg-peach/30'
                    }`}
                  >
                    {link.label}
                    {link.to === '/planner' && plannerCount > 0 && (
                      <span className="ml-2 bg-coral text-white text-xs rounded-full px-1.5 py-0.5 inline-block min-w-[1.25rem] text-center">
                        {plannerCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-peach/30 py-4 text-center text-sm text-wood/60 space-y-1">
        <p>Heartopia Recipe Calculator - Fan-made tool. Not affiliated with the game developers.</p>
        <p>
          Got a feature idea, found a bug, or have better figures?{' '}
          <a
            href="https://github.com/jake-kirkman/heartopia-recipe-calculator/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-coral hover:text-coral/80 underline"
          >
            Raise an issue on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
