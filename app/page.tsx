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
    <div className="min-h-screen flex items-center justify-center bg-brutal-bg text-brutal-fg p-4">
      <div className="shadow-block-lg corner-marks animate-enter w-full max-w-md border-2 border-brutal-fg p-8 text-center">
        <h1 className="text-4xl font-black tracking-tighter mb-4">[ SCHEDULEIN ]<span className="text-lg align-top">&reg;</span></h1>
        <p className="font-mono text-xs tracking-wider uppercase text-brutal-accent-deep animate-blink">
          ◆ Redirecting...
        </p>
      </div>
    </div>
  );
}
