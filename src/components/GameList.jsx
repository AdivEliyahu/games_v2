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

export default function GameList({
  games,
  isAdmin,
  isReordering,
  selectedId,
  onSelect,
  onReorder,
}) {
  const [ids, setIds] = useState(games.map((g) => g.id));

  useEffect(() => {
    setIds(games.map((g) => g.id));
  }, [games]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const newIds = arrayMove(ids, oldIndex, newIndex);
    setIds(newIds);
    onReorder?.(newIds);
  }

  if (!isAdmin || !isReordering) {
    return (
      <div className="grid gap-4">
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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="grid gap-4">
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
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableGameCard({ game, index, isSelected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
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
