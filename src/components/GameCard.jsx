import React from 'react';

/**
 * Card component used for both public view and admin view.  Displays the
 * ranking number, title and tags.  When in admin mode and reorder mode is
 * disabled the card can be selected for editing.  The design embraces a
 * minimal, Apple‑inspired aesthetic: a dark panel, subtle border and a
 * single accent colour for highlights.  There is no dynamic colour
 * variation per row – consistency helps reinforce the clean look.
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
  return (
    <div
      className={[
        'relative rounded-xl p-4 mb-4 cursor-pointer transition-colors duration-200',
        // Panel and border
        'bg-apple-panel border border-apple-panel hover:border-apple-accent',
        // Selection ring
        isSelected ? 'ring-2 ring-apple-accent' : '',
        // Drag overlay semi‑transparent
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
      <div className="text-apple-accent font-mono text-sm absolute top-2 left-2">
        #{game.order}
      </div>
      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 text-apple-text">{game.title}</h3>
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {game.tags.map((tag) => (
          <span
            key={tag}
            className="text-sm text-apple-accent bg-apple-background border border-apple-accent rounded-full px-2 py-0.5"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}