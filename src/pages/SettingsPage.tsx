import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useSettings } from '../context/SettingsContext';

export function SettingsPage() {
  useDocumentMeta({
    title: 'Settings',
    description: 'Configure Heartopia Recipe Calculator settings including seasonal event toggles.',
  });

  const { frostsporeEnabled, setFrostsporeEnabled, dreamlightCinematicEnabled, setDreamlightCinematicEnabled } = useSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Settings</h1>
        <p className="text-wood text-sm mt-1">
          Configure your calculator preferences.
        </p>
      </div>

      {/* Seasonal Events Card */}
      <div className="rounded-xl bg-white shadow-sm border border-peach/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-peach/20 bg-peach/10">
          <h2 className="text-lg font-bold text-bark">Seasonal Events</h2>
        </div>
        <div className="p-5 space-y-4">
          <label className="flex items-center justify-between gap-4 cursor-pointer group">
            <div>
              <span className="font-medium text-bark">Frostspore Event</span>
              <p className="text-sm text-wood mt-0.5">
                Enable to show Frostspore Event recipes and ingredients across all pages.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={frostsporeEnabled}
              onClick={() => setFrostsporeEnabled((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-coral/40 focus:ring-offset-2 ${
                frostsporeEnabled ? 'bg-coral' : 'bg-wood/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
                  frostsporeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer group">
            <div>
              <span className="font-medium text-bark">Dreamlight Cinematic</span>
              <p className="text-sm text-wood mt-0.5">
                Enable to show Dreamlight Cinematic event recipes and ingredients across all pages.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={dreamlightCinematicEnabled}
              onClick={() => setDreamlightCinematicEnabled((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-coral/40 focus:ring-offset-2 ${
                dreamlightCinematicEnabled ? 'bg-coral' : 'bg-wood/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
                  dreamlightCinematicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}
