'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('PASSWORD MISMATCH');
      return;
    }
    if (password.length < 6) {
      setError('PASSWORD TOO SHORT (MIN 6 CHARS)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('PASSWORD UPDATED. REDIRECTING...');
        setTimeout(() => router.push('/jadwal'), 1500);
      }
    } catch (err) {
      setError('SYSTEM ERROR - RETRY');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-4">
      <div className="shadow-block-lg corner-marks animate-enter w-full max-w-md border-2 border-brutal-fg p-5 sm:p-6">
        <h1 className="text-4xl font-black text-center mb-1 tracking-tighter">
          [ SCHEDULEIN ]<span className="text-base align-top">&reg;</span>
        </h1>
        <p className="text-center font-mono text-xs text-brutal-fg mb-4 opacity-70">
          SET A NEW PASSWORD
        </p>

        <div className="mb-4 border-2 border-brutal-fg p-3">
          <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-2">
            ◆ AUTHENTICATION / RESET PASSWORD
          </div>
          <div className="border-t-2 border-brutal-fg pt-2">
            {error ? (
              <div className="text-brutal-red text-xs font-bold tracking-wide">
                × {error.toUpperCase()}
              </div>
            ) : success ? (
              <div className="text-brutal-accent-deep text-xs font-bold tracking-wide">
                ✓ {success}
              </div>
            ) : (
              <div className="text-brutal-accent-deep text-xs font-bold tracking-wide">
                ◆ Enter your new password
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs font-bold tracking-wider mb-2 text-brutal-fg">
              NEW PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold tracking-wider mb-2 text-brutal-fg">
              CONFIRM NEW PASSWORD
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cta w-full bg-brutal-fg text-brutal-bg border-2 border-brutal-fg p-3 font-bold text-sm tracking-tight uppercase hover:bg-brutal-accent hover:text-brutal-fg hover:border-brutal-accent disabled:opacity-50"
          >
            {loading ? 'SAVING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}
