import React, { useEffect, useState } from 'react';
import GameCard from './GameCard';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/**
 * A wrapper component that renders a list of GameCard components and
 * enables drag‑and‑drop reordering when isReordering is true.  When the
 * reorder mode is disabled the list behaves like a normal list and cards
 * can be selected for editing in the admin sidebar.  The onReorder
 * callback returns an array of game IDs in their new order.
 */
export default function GameList({
  games,
  isAdmin,
  isReordering,
  selectedId,
  onSelect,
  onReorder,
}) {
  // Maintain a local array of IDs for drag‑and‑drop.  When the games
  // prop changes we synchronise the list.  This ensures that reorder
  // operations act on the latest state.
  const [ids, setIds] = useState(games.map((g) => g.id));
  useEffect(() => {
    setIds(games.map((g) => g.id));
  }, [games]);

  // Sensors for pointer and keyboard dragging.  The keyboard sensor
  // enables accessibility.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler invoked after a drag operation ends.  When the active item
  // has moved to a new position we update the ids array and notify the
  // parent via onReorder.
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const newIds = arrayMove(ids, oldIndex, newIndex);
    setIds(newIds);
    onReorder?.(newIds);
  }

  // When not in reorder mode we do not wrap the list in a DndContext.  This
  // avoids unnecessary overhead and ensures click handlers work normally.
  if (!isAdmin || !isReordering) {
    if (games.length === 0) {
      return (
        <div className="rounded-[24px] border border-dashed border-brand-line bg-apple-background/80 px-6 py-10 text-center text-sm text-apple-muted shadow-sm">
          No games yet. Unlock admin mode to add the first entry.
        </div>
      );
    }

    return (
      <div>
        {games
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((game, idx) => (
            <GameCard
              key={game.id}
              game={game}
              index={idx}
              isAdmin={isAdmin}
              isReordering={false}
              isSelected={selectedId === game.id}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  // When in reorder mode render the sortable list.
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {ids.map((id, index) => {
          const game = games.find((g) => g.id === id);
          return (
            <SortableGameCard
              key={id}
              game={game}
              index={index}
              isSelected={selectedId === id}
              onSelect={onSelect}
            />
          );
        })}
      </SortableContext>
    </DndContext>
  );
}

// Internal component used only in reorder mode.  It wraps a GameCard and
// applies transform/transition styles based on the drag state.
function SortableGameCard({ game, index, isSelected, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id: game.id });
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <GameCard
        game={game}
        index={index}
        isAdmin={true}
        isReordering={true}
        isSelected={isSelected}
        onSelect={onSelect}
        listeners={listeners}
        attributes={attributes}
        dragOverlay={isDragging}
      />
    </div>
  );
}
