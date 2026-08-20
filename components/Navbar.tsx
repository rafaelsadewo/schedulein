'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase';

const TICKER_ITEMS = [
  'SCHEDULEIN®',
  'PERSONAL OPERATIONS TERMINAL',
  'SCHEDULE // FINANCE // SETTINGS',
  'REV 2.6',
  'STATUS: ONLINE',
];

const NAV_ITEMS = [
  { href: '/jadwal', label: 'SCHEDULE' },
  { href: '/keuangan', label: 'FINANCE' },
  { href: '/settings', label: 'SETTINGS' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [now, setNow] = useState<Date | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const signOutButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    if (menuOpen) {
      closeButtonRef.current?.focus();
    } else {
      menuButtonRef.current?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (!menuOpen) return;
      if (e.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      // Keep Tab focus cycling inside the overlay while it's open
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === closeButtonRef.current) {
          e.preventDefault();
          signOutButtonRef.current?.focus();
        } else if (!e.shiftKey && document.activeElement === signOutButtonRef.current) {
          e.preventDefault();
          closeButtonRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Clear mock session if in mock mode
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      document.cookie = `mock-session=; path=/; max-age=0`;
    }
    router.push('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-brutal-bg text-brutal-fg border-b-2 border-brutal-fg">
        <div className="max-w-full px-4 sm:px-8 py-4 flex flex-wrap gap-3 justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">
            [ SCHEDULEIN ]<span className="text-sm align-top">&reg;</span>
          </h1>

          <output className="hidden lg:block font-mono text-[10px] tracking-widest opacity-50">
            {now ? format(now, 'yyyy-MM-dd · HH:mm:ss') : ''}
          </output>

          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            className="bg-brutal-fg text-brutal-bg border-2 border-brutal-fg font-mono text-xs sm:text-sm font-bold tracking-wider px-3 sm:px-4 py-1.5 hover:bg-brutal-accent hover:text-brutal-fg"
          >
            [ MENU ]
          </button>
        </div>

        <div className="ticker">
          <div className="ticker-track">
            {[0, 1].map((rep) => (
              <span key={rep} className="flex items-center shrink-0">
                {TICKER_ITEMS.map((item, i) => (
                  <span key={i} className="ticker-item mr-8">
                    &gt;&gt;&gt; {item}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </nav>

      <div
        className={`nav-overlay ${menuOpen ? 'open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          ref={closeButtonRef}
          onClick={() => setMenuOpen(false)}
          tabIndex={menuOpen ? 0 : -1}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-transparent border-2 border-brutal-bg text-brutal-bg font-mono text-xs sm:text-sm font-bold tracking-wider px-3 sm:px-4 py-1.5 hover:bg-brutal-bg hover:text-brutal-fg"
        >
          [ CLOSE ]
        </button>

        <div className="px-6 sm:px-16">
          {NAV_ITEMS.map((item, i) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={menuOpen ? 0 : -1}
                className="nav-overlay-item group flex items-baseline gap-4 sm:gap-8 border-b-2 py-3 sm:py-5 no-underline"
                style={{
                  transitionDelay: menuOpen ? `${i * 60}ms` : '0ms',
                  color: 'var(--bg)',
                  borderColor: 'var(--bg)',
                }}
              >
                <span className="font-mono text-sm sm:text-lg opacity-50 shrink-0">
                  0{i + 1}
                </span>
                <span
                  className={`font-display font-normal uppercase tracking-tighter leading-none text-[2.75rem] sm:text-[5.5rem] group-hover:opacity-60 ${
                    active ? 'underline decoration-4 underline-offset-8' : ''
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            ref={signOutButtonRef}
            onClick={handleLogout}
            tabIndex={menuOpen ? 0 : -1}
            className="nav-overlay-item group flex items-baseline gap-4 sm:gap-8 border-b-2 py-3 sm:py-5 w-full text-left"
            style={{
              transitionDelay: menuOpen ? `${NAV_ITEMS.length * 60}ms` : '0ms',
              color: 'var(--bg)',
              borderColor: 'var(--bg)',
              background: 'transparent',
            }}
          >
            <span className="font-mono text-sm sm:text-lg opacity-50 shrink-0">
              0{NAV_ITEMS.length + 1}
            </span>
            <span className="font-display font-normal uppercase tracking-tighter leading-none text-[2.75rem] sm:text-[5.5rem] group-hover:opacity-60">
              SIGN OUT
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
