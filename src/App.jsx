import React, { useEffect, useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import GameList from './components/GameList';
import AdminSidebar from './components/AdminSidebar';
import TerminalUnlock from './components/TerminalUnlock';
import {
  fetchGames,
  addGame,
  updateGame,
  deleteGame,
  reorderGames,
  downloadTxt,
  unlock,
} from './utils/api';

/**
 * Root component that wraps the application with the AdminProvider so
 * authentication state is available globally.  The inner component holds
 * the actual logic for fetching data and responding to UI events.
 */
export default function App() {
  return (
    <AdminProvider>
      <GameApp />
    </AdminProvider>
  );
}

function GameApp() {
  const { isAdmin, setIsAdmin } = useAdmin();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection and editing state
  const [selectedId, setSelectedId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGame, setEditingGame] = useState({ id: null, title: '', tags: [] });

  // Fetch games on mount and when unlocked
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const list = await fetchGames();
        setGames(list.sort((a, b) => a.order - b.order));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load games');
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  // Handle selecting a card for editing
  function handleSelect(game) {
    setSelectedId(game.id);
  }

  // Add new card: enter editing mode with blank game
  function handleAdd() {
    setIsEditing(true);
    setEditingGame({ id: null, title: '', tags: [] });
    setSelectedId(null);
  }

  // Edit selected card
  function handleEdit() {
    if (!selectedId) return;
    const game = games.find((g) => g.id === selectedId);
    if (!game) return;
    setIsEditing(true);
    setEditingGame({ id: game.id, title: game.title, tags: [...game.tags] });
  }

  // Delete selected card
  async function handleDelete() {
    if (!selectedId) return;
    if (!window.confirm('Delete this game?')) return;
    try {
      await deleteGame(selectedId);
      setGames((prev) => prev.filter((g) => g.id !== selectedId));
      setSelectedId(null);
    } catch (err) {
      alert('Failed to delete game');
    }
  }

  // Save editing (add or update)
  async function handleSave() {
    try {
      if (!editingGame.title.trim()) {
        alert('Title is required');
        return;
      }
      if (editingGame.id) {
        const updated = await updateGame(editingGame.id, {
          title: editingGame.title,
          tags: editingGame.tags,
        });
        setGames((prev) =>
          prev.map((g) => (g.id === editingGame.id ? { ...g, ...updated } : g)),
        );
        setSelectedId(editingGame.id);
      } else {
        const created = await addGame({
          title: editingGame.title,
          tags: editingGame.tags,
        });
        setGames((prev) => [...prev, created].sort((a, b) => a.order - b.order));
        setSelectedId(created.id);
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save game');
    }
  }

  // Cancel editing
  function handleCancel() {
    setIsEditing(false);
    setEditingGame({ id: null, title: '', tags: [] });
  }

  // Toggle reorder mode
  function handleToggleReorder() {
    setIsReordering(!isReordering);
    setSelectedId(null);
  }

  // Handle reorder callback from GameList.  Immediately persist new order.
  async function handleReorder(ids) {
    try {
      await reorderGames(ids);
      // update local order numbers to reflect new order
      setGames((prev) => {
        return ids.map((id, idx) => {
          const g = prev.find((item) => item.id === id);
          return { ...g, order: idx + 1 };
        });
      });
    } catch (err) {
      console.error(err);
      alert('Failed to reorder games');
    }
  }

  // Lock admin: clear session on server and reset admin flag
  async function handleLock() {
    try {
      // send logout request
      await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock' }),
      });
    } catch (err) {
      // ignore
    }
    setIsAdmin(false);
    setSelectedId(null);
    setIsEditing(false);
    setIsReordering(false);
  }

  // When admin unlocks via TerminalUnlock
  function handleUnlock() {
    setIsAdmin(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-neon-cyan">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-neon-pink">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {!isAdmin && (
        <TerminalUnlock onUnlock={handleUnlock} />
      )}
      <GameList
        games={games}
        isAdmin={isAdmin}
        isReordering={isReordering}
        selectedId={selectedId}
        onSelect={handleSelect}
        onReorder={isReordering ? handleReorder : undefined}
      />
      {isAdmin && (
        <AdminSidebar
          isEditing={isEditing}
          editingGame={editingGame}
          setEditingGame={setEditingGame}
          onSave={handleSave}
          onCancel={handleCancel}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isReordering={isReordering}
          onToggleReorder={handleToggleReorder}
          onLock={handleLock}
          onDownload={downloadTxt}
          hasSelection={!!selectedId}
        />
      )}
    </div>
  );
}