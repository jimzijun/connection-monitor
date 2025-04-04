'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by rendering only after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--card-background)] border border-[var(--card-border)]">
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1 rounded-md ${
          theme === 'light' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--foreground)]'
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1 rounded-md ${
          theme === 'dark' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--foreground)]'
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`px-3 py-1 rounded-md ${
          theme === 'system' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--foreground)]'
        }`}
      >
        System
      </button>
    </div>
  );
} 