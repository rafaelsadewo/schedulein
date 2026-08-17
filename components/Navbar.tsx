'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-pastel-green text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/jadwal" className="text-2xl font-bold">
          Schedulein
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/jadwal" className="hover:text-pastel-green-light transition">
            Jadwal
          </Link>
          <Link href="/keuangan" className="hover:text-pastel-green-light transition">
            Keuangan
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
