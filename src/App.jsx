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
} from './utils/api';

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
  const [selectedId, setSelectedId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGame, setEditingGame] = useState({ id: null, title: '', tags: [] });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const list = await fetchGames();
        setGames((list || []).slice().sort((a, b) => a.order - b.order));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(`Failed to load games: ${err.message}`);
        setLoading(false);
      }
    }

    load();
  }, [isAdmin]);

  function handleSelect(game) {
    setSelectedId(game.id);
  }

  function handleAdd() {
    setIsEditing(true);
    setEditingGame({ id: null, title: '', tags: [] });
    setSelectedId(null);
  }

  function handleEdit() {
    if (!selectedId) return;
    const game = games.find((g) => g.id === selectedId);
    if (!game) return;
    setIsEditing(true);
    setEditingGame({ id: game.id, title: game.title, tags: [...game.tags] });
  }

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

  function handleCancel() {
    setIsEditing(false);
    setEditingGame({ id: null, title: '', tags: [] });
  }

  function handleToggleReorder() {
    setIsReordering(!isReordering);
    setSelectedId(null);
  }

  async function handleReorder(ids) {
    try {
      await reorderGames(ids);
      setGames((prev) =>
        ids.map((id, idx) => {
          const game = prev.find((item) => item.id === id);
          return { ...game, order: idx + 1 };
        }),
      );
    } catch (err) {
      console.error(err);
      alert('Failed to reorder games');
    }
  }

  async function handleLock() {
    try {
      await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock' }),
      });
    } catch (err) {
      // Ignore lock failures and still clear local admin state.
    }

    setIsAdmin(false);
    setSelectedId(null);
    setIsEditing(false);
    setIsReordering(false);
  }

  function handleUnlock() {
    setIsAdmin(true);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-apple-accent">Loading...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-brand-danger">{error}</div>;
  }

  return (
    <div className="app-shell">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className={`glass-panel animate-fade-up p-6 md:p-8 ${isAdmin ? 'md:mr-72' : ''}`}>
          <div className="mb-8 flex flex-col gap-6 border-b border-brand-line/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="section-label">Game Library</span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-brand-ink md:text-5xl">
                Clean ranking, calm motion, sharper focus.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-brand-ink/70 md:text-lg">
                Browse the collection in a softer OpenAI-inspired visual system with crisp cards,
                muted depth, and a restrained green accent.
              </p>
            </div>
              <div className="rounded-[24px] border border-brand-line bg-apple-background px-5 py-4 text-sm text-apple-muted shadow-sm">
                <div className="font-semibold text-apple-text">{games.length} ranked games</div>
              <div className="mt-1">Admin tools stay tucked away until you unlock them.</div>
            </div>
          </div>

          {!isAdmin && <TerminalUnlock onUnlock={handleUnlock} />}

          <GameList
            games={games}
            isAdmin={isAdmin}
            isReordering={isReordering}
            selectedId={selectedId}
            onSelect={handleSelect}
            onReorder={isReordering ? handleReorder : undefined}
          />
        </div>
      </div>

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
