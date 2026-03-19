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
  const iconButtonClass =
    'flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-line bg-white text-brand-ink transition duration-200 hover:-translate-y-0.5 hover:border-brand-green hover:text-brand-green hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <aside className="fixed right-0 top-0 z-50 h-full w-full border-l border-brand-line bg-brand-mist/92 p-4 shadow-panel backdrop-blur md:w-72">
      <div className="flex h-full flex-col rounded-[28px] border border-white/80 bg-white/76 p-5">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
            Admin
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
            Control panel
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-ink/65">
            Manage entries, update tags, reorder the list, or export the current ranking.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button title="Add new" onClick={onAdd} className={iconButtonClass}>
            <PlusCircle size={24} />
          </button>
          <button
            title="Edit selected"
            onClick={onEdit}
            disabled={!hasSelection}
            className={iconButtonClass}
          >
            <Edit2 size={24} />
          </button>
          <button
            title="Delete selected"
            onClick={onDelete}
            disabled={!hasSelection}
            className={iconButtonClass}
          >
            <Trash2 size={24} />
          </button>
          <button
            title={isReordering ? 'Exit reorder mode' : 'Reorder list'}
            onClick={onToggleReorder}
            className={`${iconButtonClass} ${isReordering ? 'border-brand-green bg-brand-greenGlow text-brand-green' : ''}`}
          >
            <Move size={24} />
          </button>
          <button title="Download TXT" onClick={onDownload} className={iconButtonClass}>
            <Download size={24} />
          </button>
          <button title="Lock admin" onClick={onLock} className={iconButtonClass}>
            <Lock size={24} />
          </button>
        </div>

        {isEditing && (
          <div className="mt-6 space-y-4 rounded-[24px] border border-brand-line bg-brand-soft/55 p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-ink/70">Title</label>
              <input
                type="text"
                className="terminal-input"
                value={editingGame.title}
                onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-ink/70">Tags</label>
              <TagList
                tags={editingGame.tags}
                editable={true}
                onChange={(newTags) => setEditingGame({ ...editingGame, tags: newTags })}
              />
            </div>
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={onSave} className="primary-button gap-2">
                <Save size={16} /> Save
              </button>
              <button type="button" onClick={onCancel} className="soft-button gap-2">
                <XCircle size={16} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
