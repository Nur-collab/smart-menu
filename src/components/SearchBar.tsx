'use client';

import React from 'react';
import { useMenu } from '@/context/MenuContext';
import { Search, X, Flame, Sparkles } from 'lucide-react';
import { BadgeType } from '@/types/menu';

export function SearchBar(): React.JSX.Element {
  const { searchQuery, setSearchQuery, activeFilter, setActiveFilter, t } = useMenu();

  const filterPills: readonly { id: BadgeType | 'all'; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: t('filterAll') },
    { id: 'hit', label: t('filterHit'), icon: <Flame className="w-3 h-3 text-[#B86B3E]" /> },
    { id: 'chef_choice', label: 'Шеф ⭐', icon: <Sparkles className="w-3 h-3 text-[#8A5B94]" /> },
    { id: 'vegan', label: t('filterVegetarian') },
    { id: 'spicy', label: t('filterSpicy') },
    { id: 'discount', label: t('filterDiscount') },
  ];

  return (
    <div className="px-4 mt-3 max-w-4xl mx-auto space-y-2.5">
      {/* Поле поиска */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#A8A095] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full bg-white border border-[#EFE9E0] rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#24211D] placeholder-[#A8A095] outline-none focus:border-[#B86B3E] focus:ring-1 focus:ring-[#B86B3E]/30 transition-all shadow-[0_1px_4px_rgba(40,30,20,0.02)]"
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A095] hover:text-[#24211D] p-0.5 cursor-pointer"
            title="Очистить поиск"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Быстрые фильтры по диетам и особенностям */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {filterPills.map((pill) => {
          const isActive =
            pill.id === 'all' ? activeFilter === null : activeFilter === pill.id;

          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                if (pill.id === 'all') {
                  setActiveFilter(null);
                } else {
                  setActiveFilter(activeFilter === pill.id ? null : pill.id);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#B86B3E] text-white font-semibold shadow-sm'
                  : 'bg-white text-[#7E766D] hover:text-[#24211D] hover:bg-[#F4EBE3] border border-[#EFE9E0]'
              }`}
            >
              {pill.icon}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
