'use client';

import React from 'react';
import { useMenu } from '@/context/MenuContext';
import { Sparkles, Egg, Coffee, UtensilsCrossed, Cake, Salad, GlassWater, Flame, LucideIcon } from 'lucide-react';
import { getLocalizedCategoryName } from '@/lib/i18n';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Egg,
  Coffee,
  UtensilsCrossed,
  Cake,
  Salad,
  GlassWater,
  Flame,
};

export function CategoryNav(): React.JSX.Element {
  const { categories, selectedCategory, setSelectedCategory, items, stopList, language } = useMenu();

  return (
    <div className="sticky top-[105px] sm:top-[97px] z-20 bg-[#FBF9F5]/90 dark:bg-[#121214]/90 backdrop-blur-md py-2 px-4 border-b border-[#EFE9E0] dark:border-[#27272A] transition-colors">
      <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = ICON_MAP[cat.iconName] || Sparkles;
          const availableCount = items.filter(
            (i) => i.categoryId === cat.id && !stopList.has(i.id)
          ).length;
          const categoryTitle = getLocalizedCategoryName(cat, language);

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#24211D] dark:bg-[#F4F4F5] text-[#FBF9F5] dark:text-[#121214] shadow-sm scale-[1.02]'
                  : 'bg-white dark:bg-[#18181B] text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] hover:bg-[#F4EBE3] dark:hover:bg-[#27272A] border border-[#EFE9E0] dark:border-[#27272A]'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E8DDD2] dark:text-[#B86B3E]' : 'text-[#A8A095] dark:text-[#71717A]'}`} />
              <span>{categoryTitle}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 dark:bg-black/15 text-[#FBF9F5] dark:text-[#121214]' : 'bg-[#F4EBE3] dark:bg-[#27201C] text-[#7E766D] dark:text-[#A1A1AA]'
                }`}
              >
                {availableCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
