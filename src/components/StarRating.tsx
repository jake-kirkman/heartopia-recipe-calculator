import type { StarRating as StarRatingType } from '../data/types';

interface StarRatingProps {
  value: StarRatingType;
  onChange: (value: StarRatingType) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex gap-0.5 items-center">
      {([1, 2, 3, 4, 5] as StarRatingType[]).map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`${sizeClass} leading-none transition-transform hover:scale-110 bg-transparent border-none cursor-pointer p-0`}
          title={`${star} star${star > 1 ? 's' : ''}`}
        >
          {star <= value ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}
