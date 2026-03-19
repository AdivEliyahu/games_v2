import React, { useState } from 'react';
import { unlock } from '../utils/api';

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
    <form
      onSubmit={handleSubmit}
      className="mb-8 w-full animate-fade-up rounded-[24px] border border-brand-line bg-brand-soft/70 p-5 shadow-sm"
    >
      <label className="mb-2 block font-mono text-sm text-brand-green">admin$ unlock</label>
      <input
        type="password"
        className={`terminal-input ${error ? 'border-brand-danger focus:border-brand-danger focus:ring-brand-danger/10' : ''}`}
        placeholder="Enter admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
      {error && <p className="mt-2 text-sm text-brand-danger">Invalid password</p>}
    </form>
  );
}
