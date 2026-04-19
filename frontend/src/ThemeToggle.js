import React from 'react';
import { useTheme } from './ThemeContext';

/**
 * Fixed control available on every route; toggles Tailwind `dark` class on &lt;html&gt;.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-[200] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-lg shadow-lg backdrop-blur transition hover:scale-105 dark:border-slate-600 dark:bg-slate-800/95 dark:text-amber-100"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span aria-hidden className="select-none leading-none">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
