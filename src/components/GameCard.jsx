import React from 'react';

/**
 * Card component used for both public view and admin view.  Displays the
 * ranking number, title and tags.  When in admin mode and reorder mode is
 * disabled the card can be selected for editing.
 */
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
  // Determine neon accent color based on index to add variety.  The modulo
  // picks a color from the palette defined in tailwind.config.js.
  const accentMap = ['cyan', 'green', 'purple', 'pink'];
  const accent = accentMap[index % accentMap.length];
  const neonShadow = `neon-${accent}`;

  return (
    <div
      className={[
        'relative rounded-lg p-4 mb-4 cursor-pointer transition-shadow duration-300',
        'bg-gray-800 hover:shadow-lg',
        `border border-neon-${accent}`,
        isSelected ? 'ring-2 ring-neon-cyan' : '',
        dragOverlay ? 'opacity-50' : '',
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
      {/* Ranking number */}
      <div className="text-neon-cyan font-mono text-sm absolute top-2 left-2">
        #{game.order}
      </div>
      {/* Title */}
      <h3 className="text-xl font-bold mb-2">{game.title}</h3>
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {game.tags.map((tag) => (
          <span
            key={tag}
            className={`text-sm text-neon-${accent} bg-gray-900 border border-neon-${accent} rounded-full px-2 py-1`}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}