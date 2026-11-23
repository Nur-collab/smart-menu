'use client';

import React, { useState } from 'react';
import { SelectedOption, MenuItemOption } from '@/types/menu';
import { useMenu } from '@/context/MenuContext';
import { X, Clock, Sparkles, Plus, Check, AlertCircle } from 'lucide-react';
import {
  getLocalizedName,
  getLocalizedDescription,
  getLocalizedOptionGroupName,
  getLocalizedOptionName,
} from '@/lib/i18n';

export function DishDetailModal(): React.JSX.Element | null {
  const {
    selectedItemForDetails,
    setSelectedItemForDetails,
    items,
    addToCart,
    stopList,
    cafeInfo,
    t,
    language,
  } = useMenu();

  const [selectedOptions, setSelectedOptions] = useState<readonly SelectedOption[]>([]);
  const [comment, setComment] = useState<string>('');

  if (!selectedItemForDetails) return null;

  const item = selectedItemForDetails;
  const localizedTitle = getLocalizedName(item, language);
  const localizedDesc = getLocalizedDescription(item, language);

  const handleOptionToggle = (
    groupId: string,
    groupTitle: string,
    opt: MenuItemOption,
    multiple: boolean
  ): void => {
    setSelectedOptions((prev) => {
      const alreadySelected = prev.some((o) => o.optionId === opt.id);
      if (alreadySelected) {
        return prev.filter((o) => o.optionId !== opt.id);
      }
      const optName = getLocalizedOptionName(opt, language);
      if (multiple) {
        return [
          ...prev,
          {
            groupId,
            groupTitle,
            optionId: opt.id,
            optionName: optName,
            price: opt.price,
          },
        ];
      }
      const filtered = prev.filter((o) => o.groupId !== groupId);
      return [
        ...filtered,
        {
          groupId,
          groupTitle,
          optionId: opt.id,
          optionName: optName,
          price: opt.price,
        },
      ];
    });
  };

  const optionsTotalPrice = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
  const finalUnitPrice = item.price + optionsTotalPrice;

  const handleAddAndClose = (): void => {
    addToCart(item, selectedOptions, comment.trim() || undefined);
    setSelectedItemForDetails(null);
  };

  const recommendedDishes = items.filter(
    (i) => item.recommendedItemIds.includes(i.id) && !stopList.has(i.id)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={() => setSelectedItemForDetails(null)}
    >
      <div
        className="w-full sm:max-w-lg bg-[#FBF9F5] dark:bg-[#18181B] border border-[#EFE9E0] dark:border-[#27272A] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-slideUp text-[#24211D] dark:text-[#F4F4F5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка с фото и кнопкой закрытия */}
        <div className="relative aspect-video w-full bg-[#F4EBE3] dark:bg-[#27201C] shrink-0">
          <img
            src={item.imageUrl}
            alt={localizedTitle}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => setSelectedItemForDetails(null)}
            className="absolute top-3 right-3 p-2 bg-white/85 dark:bg-[#18181B]/85 hover:bg-white dark:hover:bg-[#27272A] text-[#24211D] dark:text-[#F4F4F5] rounded-full backdrop-blur-md shadow-md transition-colors cursor-pointer"
            title={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-sm text-[#24211D] dark:text-[#F4F4F5] text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-semibold shadow-sm border border-[#EFE9E0] dark:border-[#27272A]">
            <Clock className="w-3.5 h-3.5 text-[#B86B3E] dark:text-[#E07A43]" />
            <span>
              {t('cookingTimePrefix')}: ~{item.cookingTimeMinutes} {t('minutesShort')}
            </span>
          </div>
        </div>

        {/* Прокручиваемый контент */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Заголовок и вес */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-black text-[#24211D] dark:text-[#F4F4F5] leading-snug">
                {localizedTitle}
              </h2>
              <span className="text-lg font-black text-[#B86B3E] dark:text-[#E07A43] whitespace-nowrap">
                {item.price} {cafeInfo.currency}
              </span>
            </div>
            <p className="text-xs text-[#7E766D] dark:text-[#A1A1AA] mt-1.5 leading-relaxed">
              {localizedDesc}
            </p>
          </div>

          {/* Пищевая ценность (КБЖУ) */}
          <div className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-4 shadow-[0_1px_6px_rgba(40,30,20,0.02)]">
            <h4 className="text-[11px] font-bold text-[#8C7A6B] dark:text-[#A1A1AA] mb-2.5 uppercase tracking-wider">
              {t('kbjuTitle')} ({item.weight})
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#FBF9F5] dark:bg-[#27272A] rounded-xl p-2 border border-[#EFE9E0] dark:border-[#3F3F46]">
                <span className="text-[#8C7A6B] dark:text-[#A1A1AA] text-[10px] block">{t('caloriesLabel')}</span>
                <strong className="text-[#B86B3E] dark:text-[#E07A43] text-xs font-black">{item.calories}</strong>
                <span className="text-[9px] text-[#A8A095] dark:text-[#71717A] block">{language === 'en' ? 'kcal' : 'ккал'}</span>
              </div>
              <div className="bg-[#FBF9F5] dark:bg-[#27272A] rounded-xl p-2 border border-[#EFE9E0] dark:border-[#3F3F46]">
                <span className="text-[#8C7A6B] dark:text-[#A1A1AA] text-[10px] block">{t('proteinsLabel')}</span>
                <strong className="text-[#24211D] dark:text-[#F4F4F5] text-xs font-bold">{item.proteins}</strong>
                <span className="text-[9px] text-[#A8A095] dark:text-[#71717A] block">{language === 'en' ? 'g' : 'г'}</span>
              </div>
              <div className="bg-[#FBF9F5] dark:bg-[#27272A] rounded-xl p-2 border border-[#EFE9E0] dark:border-[#3F3F46]">
                <span className="text-[#8C7A6B] dark:text-[#A1A1AA] text-[10px] block">{t('fatsLabel')}</span>
                <strong className="text-[#24211D] dark:text-[#F4F4F5] text-xs font-bold">{item.fats}</strong>
                <span className="text-[9px] text-[#A8A095] dark:text-[#71717A] block">{language === 'en' ? 'g' : 'г'}</span>
              </div>
              <div className="bg-[#FBF9F5] dark:bg-[#27272A] rounded-xl p-2 border border-[#EFE9E0] dark:border-[#3F3F46]">
                <span className="text-[#8C7A6B] dark:text-[#A1A1AA] text-[10px] block">{t('carbsLabel')}</span>
                <strong className="text-[#24211D] dark:text-[#F4F4F5] text-xs font-bold">{item.carbs}</strong>
                <span className="text-[9px] text-[#A8A095] dark:text-[#71717A] block">{language === 'en' ? 'g' : 'г'}</span>
              </div>
            </div>
          </div>

          {/* Аллергены */}
          {item.allergens.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#7E766D] dark:text-[#A1A1AA] bg-[#F4EBE3]/50 dark:bg-[#27201C]/50 p-2.5 rounded-xl border border-[#E8DDD2] dark:border-[#3D3028]">
              <AlertCircle className="w-4 h-4 text-[#B86B3E] dark:text-[#E07A43] shrink-0" />
              <span>
                {t('allergensTitle')}:{' '}
                <strong className="text-[#24211D] dark:text-[#F4F4F5] font-semibold">
                  {item.allergens.join(', ')}
                </strong>
              </span>
            </div>
          )}

          {/* Группы модификаторов и опций */}
          {item.optionGroups && item.optionGroups.length > 0 && (
            <div className="space-y-4">
              {item.optionGroups.map((group) => {
                const groupTitle = getLocalizedOptionGroupName(group, language);
                return (
                  <div key={group.id} className="space-y-2">
                    <h4 className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] uppercase tracking-wider flex items-center justify-between">
                      <span>{groupTitle}</span>
                      <span className="text-[10px] text-[#8C7A6B] dark:text-[#A1A1AA] font-normal">
                        {group.multiple ? (language === 'en' ? 'multiple choice' : language === 'kg' ? 'бир нече тандоо' : 'несколько вариантов') : (language === 'en' ? 'single choice' : language === 'kg' ? 'бир тандоо' : 'один вариант')}
                      </span>
                    </h4>
                    <div className="space-y-1.5">
                      {group.options.map((opt) => {
                        const isChecked = selectedOptions.some((o) => o.optionId === opt.id);
                        const optName = getLocalizedOptionName(opt, language);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              handleOptionToggle(group.id, groupTitle, opt, group.multiple)
                            }
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[#F4EBE3] dark:bg-[#2D231C] border-[#B86B3E] dark:border-[#E07A43] text-[#24211D] dark:text-[#F4F4F5] shadow-sm'
                                : 'bg-white dark:bg-[#1C1C1F] border-[#EFE9E0] dark:border-[#27272A] text-[#4A433B] dark:text-[#D4C7B8] hover:border-[#DFD5C7] dark:hover:border-[#3F3F46]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                                  isChecked
                                    ? 'bg-[#B86B3E] border-[#B86B3E] text-white font-bold'
                                    : 'border-[#D5CDC3] dark:border-[#52525B]'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span className="font-semibold">{optName}</span>
                            </div>
                            <span className="font-bold text-[#B86B3E] dark:text-[#E07A43]">
                              +{opt.price} {cafeInfo.currency}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Комментарий для кухни */}
          <div>
            <label
              htmlFor="dish-comment"
              className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] uppercase tracking-wider block mb-1.5"
            >
              {language === 'en' ? 'Special kitchen instructions' : language === 'kg' ? 'Ашканага өзгөчө каалоолор' : 'Пожелание к блюду для кухни'}
            </label>
            <input
              id="dish-comment"
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              className="w-full bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl px-3.5 py-2.5 text-xs text-[#24211D] dark:text-[#F4F4F5] placeholder-[#A8A095] dark:placeholder-[#71717A] outline-none focus:border-[#B86B3E] dark:focus:border-[#E07A43] transition-all"
            />
          </div>

          {/* Upsell: С этим блюдом идеально сочетается */}
          {recommendedDishes.length > 0 && (
            <div className="bg-[#F4EBE3]/60 dark:bg-[#27201C]/60 border border-[#E8DDD2] dark:border-[#3D3028] rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B86B3E] dark:text-[#E07A43]">
                <Sparkles className="w-3.5 h-3.5 text-[#B86B3E] dark:text-[#E07A43]" />
                <span>{t('perfectPair')}</span>
              </div>
              <div className="space-y-2">
                {recommendedDishes.map((rec) => {
                  const recTitle = getLocalizedName(rec, language);
                  return (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-3 bg-white dark:bg-[#1C1C1F] p-2.5 rounded-2xl border border-[#EFE9E0] dark:border-[#27272A] shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={rec.imageUrl}
                          alt={recTitle}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] truncate">
                            {recTitle}
                          </h5>
                          <span className="text-xs text-[#B86B3E] dark:text-[#E07A43] font-bold">
                            {rec.price} {cafeInfo.currency}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(rec)}
                        className="flex items-center gap-1 bg-[#F4EBE3] dark:bg-[#2D231C] hover:bg-[#B86B3E] text-[#B86B3E] dark:text-[#E07A43] hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E8DDD2] dark:border-[#3D3028] transition-all shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('addToCart')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Закрепленный футер с итоговой ценой */}
        <div className="p-4 bg-white dark:bg-[#18181B] border-t border-[#EFE9E0] dark:border-[#27272A] flex items-center justify-between gap-3 shadow-[0_-2px_10px_rgba(40,30,20,0.03)]">
          <div>
            <span className="text-[10px] text-[#8C7A6B] dark:text-[#A1A1AA] uppercase tracking-wider block font-semibold">
              {language === 'en' ? 'Serving Price' : language === 'kg' ? 'Порциянын баасы' : 'Стоимость порции'}
            </span>
            <span className="text-lg font-black text-[#24211D] dark:text-[#F4F4F5]">
              {finalUnitPrice} {cafeInfo.currency}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddAndClose}
            className="flex-1 bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white font-bold text-sm py-3 px-5 rounded-2xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('addToCartWithPrice')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
