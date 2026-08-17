'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push('/jadwal');
      } else {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pastel-green-light">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-pastel-green-dark mb-2">Schedulein</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
