type BadgeVariant = 'coral' | 'sage' | 'sky' | 'mint' | 'peach' | 'wood' | 'gray';

const variantClasses: Record<BadgeVariant, string> = {
  coral: 'bg-coral/20 text-coral',
  sage: 'bg-sage/20 text-bark',
  sky: 'bg-sky/20 text-bark',
  mint: 'bg-mint/20 text-bark',
  peach: 'bg-peach text-bark',
  wood: 'bg-wood/20 text-wood',
  gray: 'bg-gray-200 text-gray-500',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'peach', className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function TbdBadge() {
  return <Badge variant="gray">TBD</Badge>;
}
