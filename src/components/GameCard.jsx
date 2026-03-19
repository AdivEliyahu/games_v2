import React from 'react';

export default function GameCard({
  game,
  index,
  isAdmin = false,
  isReordering = false,
  isSelected = false,
  onSelect,
  listeners,
  attributes,
  dragOverlay = false,
}) {
  const accentStyles = [
    'border-brand-green/30 bg-brand-greenGlow/50',
    'border-brand-line bg-white/85',
    'border-brand-ink/10 bg-brand-soft/85',
    'border-brand-green/20 bg-white/90',
  ];

  const accentStyle = accentStyles[index % accentStyles.length];

  return (
    <div
      className={[
        'group relative mb-4 cursor-pointer overflow-hidden rounded-[24px] border p-5 shadow-card transition duration-300',
        accentStyle,
        isSelected ? 'border-brand-green shadow-glow ring-4 ring-brand-green/10' : 'hover:-translate-y-1 hover:border-brand-green/40',
        dragOverlay ? 'scale-[0.99] opacity-60' : 'animate-fade-up',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        if (isAdmin && !isReordering) {
          onSelect?.(game);
        }
      }}
      {...attributes}
      {...listeners}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-green/50 to-transparent opacity-70" />
      <div className="text-sm font-medium uppercase tracking-[0.24em] text-brand-green/80">
        #{game.order}
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-brand-ink">{game.title}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {game.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-brand-line bg-white/80 px-3 py-1 text-sm text-brand-ink/70 transition duration-200 group-hover:border-brand-green/30 group-hover:text-brand-green"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
