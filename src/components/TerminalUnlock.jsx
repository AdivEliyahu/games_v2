import React, { useState } from 'react';
import { unlock } from '../utils/api';

/**
 * Terminal‑style input used to unlock admin mode.  Shows a blinking caret
 * and monospace font to give a command line vibe.  Upon pressing Enter the
 * password is sent to the server.  On success the parent callback is
 * invoked.  On failure the input field is cleared and an error state is
 * shown briefly.
 */
export default function TerminalUnlock({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    const ok = await unlock(password);
    setLoading(false);
    if (ok) {
      setPassword('');
      onUnlock();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full mb-6">
      <label className="block mb-2 font-mono text-neon-cyan">
        admin$ unlock
      </label>
      <input
        type="password"
        className={`terminal-input w-full ${error ? 'border-neon-pink ring-neon-pink' : ''}`}
        placeholder="Enter admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
      {error && (
        <p className="mt-1 text-sm text-neon-pink">Invalid password</p>
      )}
    </form>
  );
}