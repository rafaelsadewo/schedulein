'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // For mock auth, set cookie
        if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
          document.cookie = `mock-session=true; path=/; max-age=86400`;
        }
        router.push('/jadwal');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light">
      <div className="w-full max-w-md border-2 border-brutal-fg-light p-8">
        <h1 className="text-4xl font-black text-center mb-2 tracking-tighter">
          [ SCHEDULEIN ]
        </h1>
        <p className="text-center font-mono text-xs text-brutal-fg-light mb-8 opacity-70">
          PERSONAL SCHEDULE & FINANCE TRACKER
        </p>

        <div className="mb-8 border-2 border-brutal-fg-light p-4">
          <div className="font-mono text-xs tracking-wider text-brutal-fg-light uppercase mb-2">
            AUTH / LOGIN
          </div>
          <div className="border-t-2 border-brutal-fg-light pt-2">
            {error ? (
              <div className="text-brutal-red text-xs font-bold tracking-wide">
                [ERR] {error.toUpperCase()}
              </div>
            ) : (
              <div className="text-brutal-accent text-xs font-bold tracking-wide">
                [→] SIAP INPUT CREDENTIALS
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-mono text-xs font-bold tracking-wider mb-2 text-brutal-fg-light">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
              placeholder="USER@DOMAIN.COM"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold tracking-wider mb-2 text-brutal-fg-light">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brutal-fg-light text-brutal-bg-light border-2 border-brutal-fg-light p-3 font-bold text-sm tracking-tight uppercase hover:bg-brutal-accent hover:text-brutal-fg-light disabled:opacity-50"
          >
            {loading ? 'LOGGING IN' : 'LOGIN'}
          </button>
        </form>

        <hr className="my-8 border-0 border-t-2 border-brutal-fg-light" />

        <div className="text-center font-mono text-xs tracking-wider">
          <div className="mb-2 text-brutal-fg-light">NO ACCOUNT?</div>
          <Link href="/register" className="text-brutal-accent font-bold hover:bg-brutal-accent hover:text-brutal-fg-light px-2">
            &gt;&gt; REGISTER &lt;&lt;
          </Link>
        </div>
      </div>
    </div>
  );
}
