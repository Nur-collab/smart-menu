'use client';

import React from 'react';
import { useMenu } from '@/context/MenuContext';
import { Sparkles } from 'lucide-react';

export function FloatingAiSommelierButton(): React.JSX.Element | null {
  const { openSommelierModal, activeModal, t } = useMenu();

  // Не показываем, если открыт модал или корзина
  if (activeModal !== null) return null;

  return (
    <aside
      aria-label="AI-Сомелье"
      className="fixed bottom-24 right-4 z-30 flex items-center gap-2 group animate-bounce-subtle"
    >
      <button
        type="button"
        onClick={openSommelierModal}
        className="flex items-center gap-2 bg-[#24211D] hover:bg-[#38332C] text-[#FBF9F5] pl-3 pr-4 py-2.5 rounded-full shadow-lg border border-[#3E3832] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        title={t('aiSommelierButton')}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#B86B3E] to-[#E39666] flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <span className="text-[11px] font-black tracking-wide block leading-tight">
            {t('aiSommelierButton')}
          </span>
          <span className="text-[9px] text-[#C4B8A9] font-medium block leading-none">
            Айпери ✨
          </span>
        </div>
      </button>
    </aside>
  );
}
