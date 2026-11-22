'use client';

import React from 'react';
import { useMenu } from '@/context/MenuContext';
import { Sparkles, Egg, Coffee, UtensilsCrossed, Cake, Salad, GlassWater, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Egg,
  Coffee,
  UtensilsCrossed,
  Cake,
  Salad,
  GlassWater,
};

export function CategoryNav(): React.JSX.Element {
  const { categories, selectedCategory, setSelectedCategory, items, stopList } = useMenu();

  return (
    <div className="sticky top-[105px] sm:top-[97px] z-20 bg-[#FBF9F5]/90 backdrop-blur-md py-2 px-4 border-b border-[#EFE9E0]">
      <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = ICON_MAP[cat.iconName] || Sparkles;
          const availableCount = items.filter(
            (i) => i.categoryId === cat.id && !stopList.has(i.id)
          ).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm scale-[1.02]'
                  : 'bg-white text-[#7E766D] hover:text-[#24211D] hover:bg-[#F4EBE3] border border-[#EFE9E0]'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E8DDD2]' : 'text-[#A8A095]'}`} />
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-[#FBF9F5]' : 'bg-[#F4EBE3] text-[#7E766D]'
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
