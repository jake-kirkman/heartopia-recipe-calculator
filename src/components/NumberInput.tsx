import { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function NumberInput({ value, onChange, min = 1, max = 999 }: NumberInputProps) {
  const [draft, setDraft] = useState(String(value));

  // Sync draft when value changes externally (e.g. +/- buttons)
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseInt(draft);
    if (isNaN(parsed) || draft === '') {
      setDraft(String(value));
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setDraft(String(clamped));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-md bg-peach/50 hover:bg-peach text-bark font-bold text-sm border-none cursor-pointer transition-colors"
        disabled={value <= min}
      >
        -
      </button>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
        className="w-12 h-7 text-center rounded-md border border-peach/50 bg-white text-bark text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-md bg-peach/50 hover:bg-peach text-bark font-bold text-sm border-none cursor-pointer transition-colors"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
