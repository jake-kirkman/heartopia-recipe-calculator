import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-wood hover:text-bark cursor-pointer bg-transparent border-none p-0 transition-colors"
      >
        <span className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}>
          &#9654;
        </span>
        {title}
      </button>

      {expanded && <div className="mt-3">{children}</div>}
    </div>
  );
}
