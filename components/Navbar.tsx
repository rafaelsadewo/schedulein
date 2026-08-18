'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';

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
    <nav className="bg-brutal-bg text-brutal-fg border-b-2 border-brutal-fg">
      <div className="max-w-full px-4 sm:px-8 py-4 flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">
          [ SCHEDULEIN ]
        </h1>

        <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
          <Link href="/jadwal" className="font-mono text-xs sm:text-sm font-bold tracking-wider hover:bg-brutal-accent hover:text-brutal-fg px-2 sm:px-3 py-1 border-2 border-brutal-fg">
            SCHEDULE
          </Link>
          <Link href="/keuangan" className="font-mono text-xs sm:text-sm font-bold tracking-wider hover:bg-brutal-accent hover:text-brutal-fg px-2 sm:px-3 py-1 border-2 border-brutal-fg">
            FINANCE
          </Link>
          <Link href="/settings" className="font-mono text-xs sm:text-sm font-bold tracking-wider hover:bg-brutal-accent hover:text-brutal-fg px-2 sm:px-3 py-1 border-2 border-brutal-fg">
            ▪
          </Link>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="bg-brutal-red text-brutal-bg border-2 border-brutal-red font-mono text-xs sm:text-sm font-bold tracking-wider px-2 sm:px-3 py-1 hover:bg-brutal-fg hover:text-brutal-bg"
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </nav>
  );
}
