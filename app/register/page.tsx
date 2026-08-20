'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        // For mock auth, set cookie immediately
        if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
          document.cookie = `mock-session=true; path=/; max-age=86400`;
          setTimeout(() => router.push('/jadwal'), 1000);
        } else {
          setSuccess('REGISTRATION SUCCESSFUL. CHECK EMAIL.');
          setTimeout(() => router.push('/login'), 2000);
        }
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
          CREATE NEW ACCOUNT TO BEGIN
        </p>

        <div className="mb-4 border-2 border-brutal-fg p-3">
          <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-2">
            ◆ AUTHENTICATION / REGISTER
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
                ◆ Complete form to register
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block font-mono text-xs font-bold tracking-wider mb-2 text-brutal-fg">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
              placeholder="USER@DOMAIN.COM"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold tracking-wider mb-2 text-brutal-fg">
              PASSWORD
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
              CONFIRM PASSWORD
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
            {loading ? 'REGISTERING' : 'REGISTER'}
          </button>
        </form>

        <div className="flex items-center justify-center font-mono text-xs tracking-wider mt-4 pt-4 border-t-2 border-brutal-fg">
          <span className="text-brutal-fg mr-2">HAVE ACCOUNT?</span>
          <Link href="/login" className="text-brutal-accent-deep font-bold hover:bg-brutal-accent hover:text-brutal-fg px-2">
            &gt;&gt; LOGIN &lt;&lt;
          </Link>
        </div>
      </div>
    </div>
  );
}
