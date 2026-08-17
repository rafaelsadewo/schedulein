'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Clear mock session if in mock mode
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      document.cookie = `mock-session=; path=/; max-age=0`;
    }
    router.push('/login');
  };

  return (
    <nav className="bg-brutal-bg-light text-brutal-fg-light border-b-2 border-brutal-fg-light">
      <div className="max-w-full px-8 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tighter">
          [ SCHEDULEIN ]
        </h1>

        <div className="flex gap-8 items-center">
          <Link href="/jadwal" className="font-mono text-sm font-bold tracking-wider hover:bg-brutal-accent hover:text-brutal-fg-light px-3 py-1 border-2 border-brutal-fg-light">
            JADWAL
          </Link>
          <Link href="/keuangan" className="font-mono text-sm font-bold tracking-wider hover:bg-brutal-accent hover:text-brutal-fg-light px-3 py-1 border-2 border-brutal-fg-light">
            KEUANGAN
          </Link>
          <button
            onClick={handleLogout}
            className="bg-brutal-red text-brutal-bg-light border-2 border-brutal-red font-mono text-sm font-bold tracking-wider px-3 py-1 hover:bg-brutal-fg-light hover:text-brutal-bg-light"
          >
            LOGOUT
          </button>
        </div>
      </div>
    </nav>
  );
}
