'use client';

import React from 'react';
import { MenuItem, BadgeType } from '@/types/menu';
import { useMenu } from '@/context/MenuContext';
import { Plus, Minus, Flame, Sparkles, Sprout, Wheat, Clock } from 'lucide-react';
import { getLocalizedName, getLocalizedDescription } from '@/lib/i18n';

interface DishCardProps {
  readonly item: MenuItem;
}

export function DishCard({ item }: DishCardProps): React.JSX.Element {
  const {
    stopList,
    cart,
    addToCart,
    updateCartItemQuantity,
    setSelectedItemForDetails,
    cafeInfo,
    getItemPriceWithDiscount,
    t,
    language,
  } = useMenu();

  const priceInfo = getItemPriceWithDiscount(item);
  const isStopListed = stopList.has(item.id);
  const localizedTitle = getLocalizedName(item, language);
  const localizedDesc = getLocalizedDescription(item, language);

  // Находим общее количество данного блюда в корзине
  const cartEntries = cart.filter((ci) => ci.menuItem.id === item.id);
  const totalInCart = cartEntries.reduce((acc, ci) => acc + ci.quantity, 0);

  const handleCardClick = (): void => {
    if (!isStopListed) {
      setSelectedItemForDetails(item);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (isStopListed) return;

    // Если есть обязательные опции, открываем модалку деталей
    const hasRequiredOptions = item.optionGroups?.some((g) => g.required);
    if (hasRequiredOptions) {
      setSelectedItemForDetails(item);
      return;
    }

    addToCart(item);
  };

  const handleIncrement = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (cartEntries.length > 0) {
      updateCartItemQuantity(cartEntries[0].cartItemId, 1);
    } else {
      addToCart(item);
    }
  };

  const handleDecrement = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (cartEntries.length > 0) {
      updateCartItemQuantity(cartEntries[0].cartItemId, -1);
    }
  };

  const renderBadge = (badge: BadgeType): React.JSX.Element | null => {
    switch (badge) {
      case 'hit':
        return (
          <span
            key={badge}
            className="bg-[#F4EBE3] text-[#B86B3E] font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-0.5 border border-[#E8DDD2] shadow-sm"
          >
            <Flame className="w-2.5 h-2.5" /> {t('badgeHit')}
          </span>
        );
      case 'chef_choice':
        return (
          <span
            key={badge}
            className="bg-[#F2EBF5] text-[#7A4B85] font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-0.5 border border-[#E4D5E8]"
          >
            <Sparkles className="w-2.5 h-2.5" /> {t('badgeChef')}
          </span>
        );
      case 'vegan':
        return (
          <span
            key={badge}
            className="bg-[#EBF5ED] text-[#2F6B42] font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-0.5 border border-[#D5EADB]"
          >
            <Sprout className="w-2.5 h-2.5" /> {t('badgeVegan')}
          </span>
        );
      case 'spicy':
        return (
          <span
            key={badge}
            className="bg-[#FDF0ED] text-[#B84232] font-bold px-2 py-0.5 rounded-full text-[10px] border border-[#FADBD4]"
          >
            🌶️ {t('badgeSpicy')}
          </span>
        );
      case 'gluten_free':
        return (
          <span
            key={badge}
            className="bg-[#F7F3E8] text-[#8C712B] font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-0.5 border border-[#EDE2C5]"
          >
            <Wheat className="w-2.5 h-2.5" /> {t('badgeGlutenFree')}
          </span>
        );
      case 'discount':
        return (
          <span
            key={badge}
            className="bg-[#FDECEE] text-[#B83A4A] font-bold px-2 py-0.5 rounded-full text-[10px] border border-[#F8D2D7]"
          >
            % {t('badgeDiscount')}
          </span>
        );
      case 'breakfast':
        return (
          <span
            key={badge}
            className="bg-[#F7F1E6] text-[#7A612A] font-bold px-2 py-0.5 rounded-full text-[10px] border border-[#ECE0C8]"
          >
            {t('badgeBreakfast')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCardClick();
      }}
      className={`group relative bg-white border border-[#EFE9E0] rounded-3xl overflow-hidden hover:border-[#DFD5C7] hover:shadow-[0_6px_20px_rgba(40,30,20,0.06)] transition-all duration-300 flex flex-col cursor-pointer ${
        isStopListed ? 'opacity-50 grayscale pointer-events-none' : ''
      }`}
    >
      {/* Изображение блюда */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4EBE3]">
        <img
          src={item.imageUrl}
          alt={localizedTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Бейджи в левом верхнем углу */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
          {priceInfo.isHappyHoursDiscount && (
            <span className="bg-[#24211D] text-[#E39666] font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-[#3E3832] shadow-sm animate-pulse">
              🌙 -20%
            </span>
          )}
          {item.badges.map(renderBadge)}
        </div>

        {/* Стоп-лист плашка */}
        {isStopListed && (
          <div className="absolute inset-0 bg-[#24211D]/75 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
            <span className="bg-[#B83A4A] text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              {t('outOfStock')}
            </span>
          </div>
        )}

        {/* Время приготовления */}
        <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-md text-[#24211D] text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold shadow-sm border border-[#EFE9E0]/50">
          <Clock className="w-2.5 h-2.5 text-[#B86B3E]" />
          <span>
            {item.cookingTimeMinutes} {t('minutesShort')}
          </span>
        </div>
      </div>

      {/* Описание и цена */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm text-[#24211D] group-hover:text-[#B86B3E] transition-colors line-clamp-1">
              {localizedTitle}
            </h3>
          </div>

          <p className="text-xs text-[#7E766D] line-clamp-2 mt-1 leading-relaxed">
            {localizedDesc}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-[#A8A095] mt-2 font-medium">
            <span>{item.weight}</span>
            <span>•</span>
            <span>
              {item.calories} {language === 'en' ? 'kcal' : 'ккал'}
            </span>
          </div>
        </div>

        {/* Футер карточки: Цена и Кнопка добавления */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#F2ECE4]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-[#24211D]">
              {priceInfo.currentPrice} {cafeInfo.currency}
            </span>
            {(priceInfo.isHappyHoursDiscount || item.oldPrice) && (
              <span className="text-xs text-[#A8A095] line-through font-medium">
                {priceInfo.originalPrice} {cafeInfo.currency}
              </span>
            )}
          </div>

          {totalInCart > 0 ? (
            <div
              className="flex items-center gap-2 bg-[#B86B3E] text-white rounded-2xl p-1 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 flex items-center justify-center rounded-xl hover:bg-[#A3592E] active:scale-95 transition-colors font-bold cursor-pointer"
                title="Уменьшить"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-xs font-black w-4 text-center">{totalInCart}</span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 flex items-center justify-center rounded-xl hover:bg-[#A3592E] active:scale-95 transition-colors font-bold cursor-pointer"
                title="Увеличить"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isStopListed}
              onClick={handleQuickAdd}
              className="flex items-center gap-1.5 bg-[#F4EBE3] hover:bg-[#B86B3E] text-[#B86B3E] hover:text-white active:scale-95 text-xs font-bold px-3.5 py-1.5 rounded-2xl transition-all border border-[#E8DDD2] shadow-sm cursor-pointer"
              title={t('addToCart')}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t('addToCart')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
