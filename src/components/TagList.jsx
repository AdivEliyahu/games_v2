import React, { useState } from 'react';

export default function TagList({ tags, editable = false, onChange }) {
  const [input, setInput] = useState('');

  function addTag(tag) {
    const trimmed = tag.trim().replace(/^#+/, '');
    if (!trimmed || tags.includes(trimmed)) return;
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

    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center rounded-full border border-brand-line bg-white px-3 py-1 text-sm text-brand-ink/75"
        >
          #{tag}
          {editable && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-brand-danger"
            >
              x
            </button>
          )}
        </span>
      ))}

      {editable && (
        <input
          type="text"
          className="min-w-[7rem] border-b border-brand-green/40 bg-transparent text-brand-ink outline-none placeholder:text-brand-ink/35"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'tags' : ''}
        />
      )}
    </div>
  );
}
