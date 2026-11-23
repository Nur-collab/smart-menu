'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className = '',
  showLabel = false,
}: ThemeToggleProps): React.JSX.Element {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-2xl border transition-all flex items-center justify-center active:scale-95 cursor-pointer shadow-xs ${
        isDark
          ? 'bg-[#1C1C1F] hover:bg-[#27272A] text-[#FBBF24] border-[#27272A]'
          : 'bg-white hover:bg-[#F4EBE3] text-[#B86B3E] border-[#EFE9E0]'
      } ${className}`}
      title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
      aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#FBBF24] transition-transform duration-300 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="w-4 h-4 text-[#B86B3E] transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
      {showLabel && (
        <span className="ml-1.5 text-xs font-bold text-[#24211D] dark:text-[#F4F4F5]">
          {isDark ? 'Светлая' : 'Темная'}
        </span>
      )}
    </button>
  );
}
