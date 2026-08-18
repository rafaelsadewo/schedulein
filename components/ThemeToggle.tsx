'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="bg-brutal-bg text-brutal-fg border-2 border-brutal-fg font-mono text-sm font-bold tracking-wider px-3 py-1 hover:bg-brutal-accent hover:text-brutal-fg"
    >
      {isDark ? '○' : '●'}
    </button>
  );
}
