'use client';

import React from 'react';
import { useMenu } from '@/context/MenuContext';
import { Language, LANGUAGE_LABELS } from '@/lib/i18n';

export function LanguageSwitcher(): React.JSX.Element {
  const { language, setLanguage } = useMenu();

  const languages: readonly Language[] = ['ru', 'kg', 'en'];

  return (
    <div className="flex items-center bg-[#FBF9F5] dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] p-0.5 rounded-2xl shadow-sm">
      {languages.map((lang) => {
        const isCurrent = language === lang;
        const info = LANGUAGE_LABELS[lang];

        return (
          <button
            key={lang}
            type="button"
            data-testid={`lang-btn-${lang}`}
            onClick={() => setLanguage(lang)}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isCurrent
                ? 'bg-[#24211D] dark:bg-[#F4F4F5] text-[#FBF9F5] dark:text-[#121214] shadow-sm'
                : 'text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] hover:bg-[#F2ECE4]/60 dark:hover:bg-[#27272A]'
            }`}
            title={`Сменить язык на ${info.label}`}
          >
            <span className="text-xs">{info.flag}</span>
            <span>{info.short}</span>
          </button>
        );
      })}
    </div>
  );
}
