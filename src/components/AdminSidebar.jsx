import React from 'react';
import {
  PlusCircle,
  Edit2,
  Trash2,
  Save,
  XCircle,
  Lock,
  Download,
  Move,
} from 'lucide-react';
import TagList from './TagList';

/**
 * Sidebar shown only when admin mode is unlocked.  It lists a series of
 * action icons and, when in editing mode, renders a simple form for
 * editing the title and tags of a game.  It relies on parent‑passed
 * callbacks to update state and persist changes.
 */
export default function AdminSidebar({
  isEditing,
  editingGame,
  setEditingGame,
  onSave,
  onCancel,
  onAdd,
  onEdit,
  onDelete,
  isReordering,
  onToggleReorder,
  onLock,
  onDownload,
  hasSelection,
}) {
  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-apple-panel border-l border-apple-accent shadow-lg flex flex-col p-4 space-y-4 z-50 overflow-y-auto">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          title="Add new"
          onClick={onAdd}
          className={`${hasSelection ? '' : ''} text-apple-accent hover:text-apple-accent`}
        >
          <PlusCircle size={24} />
        </button>
        <button
          title="Edit selected"
          onClick={onEdit}
          disabled={!hasSelection}
          className={`${!hasSelection ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Edit2 size={24} className="text-apple-accent" />
        </button>
        <button
          title="Delete selected"
          onClick={onDelete}
          disabled={!hasSelection}
          className={`${!hasSelection ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Trash2 size={24} className="text-red-500" />
        </button>
        <button
          title={isReordering ? 'Exit reorder mode' : 'Reorder list'}
          onClick={onToggleReorder}
        >
          <Move size={24} className="text-apple-accent" />
        </button>
        <button title="Download TXT" onClick={onDownload}>
          <Download size={24} className="text-apple-accent" />
        </button>
        <button title="Lock admin" onClick={onLock}>
          <Lock size={24} className="text-apple-accent" />
        </button>
      </div>

      {/* Editing form */}
      {isEditing && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm mb-1 text-apple-muted">Title</label>
            <input
              type="text"
              className="w-full bg-apple-background border border-apple-accent rounded px-2 py-1 text-apple-text focus:outline-none focus:ring-1 focus:ring-apple-accent"
              value={editingGame.title}
              onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-apple-muted">Tags</label>
            <TagList
              tags={editingGame.tags}
              editable={true}
              onChange={(newTags) => setEditingGame({ ...editingGame, tags: newTags })}
            />
          </div>
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-1 px-3 py-1 bg-apple-accent text-black rounded hover:bg-apple-accent"
            >
              <Save size={16} /> Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1 bg-red-500 text-black rounded hover:bg-red-600"
            >
              <XCircle size={16} /> Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}