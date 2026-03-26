import React, { useState } from 'react';

/**
 * TagList shows a list of tags with optional editing controls.  In edit mode
 * the user can add new tags by typing and pressing Enter or comma.  Tags
 * can be removed by clicking the × button.  The parent component is
 * responsible for persisting changes.
 */
export default function TagList({ tags, editable = false, onChange }) {
  const [input, setInput] = useState('');

  function addTag(tag) {
    const trimmed = tag.trim().replace(/^#+/, '');
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput('');
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag(input);
    }
    // When backspace is pressed on empty input remove last tag
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      const last = tags[tags.length - 1];
      removeTag(last);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center text-sm text-apple-accent bg-apple-background border border-apple-accent rounded-full px-2 py-0.5"
        >
          #{tag}
          {editable && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-red-500"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {editable && (
        <input
          type="text"
          className="bg-transparent outline-none border-b border-apple-accent text-apple-accent w-20"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'tags' : ''}
        />
      )}
    </div>
  );
}