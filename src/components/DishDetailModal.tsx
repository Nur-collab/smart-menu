'use client';

import React, { useState } from 'react';
import { SelectedOption, MenuItemOption } from '@/types/menu';
import { useMenu } from '@/context/MenuContext';
import { X, Clock, Sparkles, Plus, Check, AlertCircle } from 'lucide-react';

export function DishDetailModal(): React.JSX.Element | null {
  const {
    selectedItemForDetails,
    setSelectedItemForDetails,
    items,
    addToCart,
    stopList,
    cafeInfo,
  } = useMenu();

  const [selectedOptions, setSelectedOptions] = useState<readonly SelectedOption[]>([]);
  const [comment, setComment] = useState<string>('');

  if (!selectedItemForDetails) return null;

  const item = selectedItemForDetails;

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
      if (multiple) {
        return [
          ...prev,
          {
            groupId,
            groupTitle,
            optionId: opt.id,
            optionName: opt.name,
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
          optionName: opt.name,
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
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={() => setSelectedItemForDetails(null)}
    >
      <div
        className="w-full sm:max-w-lg bg-[#FBF9F5] border border-[#EFE9E0] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка с фото и кнопкой закрытия */}
        <div className="relative aspect-video w-full bg-[#F4EBE3] shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => setSelectedItemForDetails(null)}
            className="absolute top-3 right-3 p-2 bg-white/85 hover:bg-white text-[#24211D] rounded-full backdrop-blur-md shadow-md transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[#24211D] text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-semibold shadow-sm border border-[#EFE9E0]">
            <Clock className="w-3.5 h-3.5 text-[#B86B3E]" />
            <span>Время подачи: ~{item.cookingTimeMinutes} мин</span>
          </div>
        </div>

        {/* Прокручиваемый контент */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Заголовок и вес */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-black text-[#24211D] leading-snug">
                {item.name}
              </h2>
              <span className="text-lg font-black text-[#B86B3E] whitespace-nowrap">
                {item.price} {cafeInfo.currency}
              </span>
            </div>
            <p className="text-xs text-[#7E766D] mt-1.5 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Пищевая ценность (КБЖУ) */}
          <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 shadow-[0_1px_6px_rgba(40,30,20,0.02)]">
            <h4 className="text-[11px] font-bold text-[#8C7A6B] mb-2.5 uppercase tracking-wider">
              Пищевая ценность на порцию ({item.weight})
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#FBF9F5] rounded-xl p-2 border border-[#EFE9E0]">
                <span className="text-[#8C7A6B] text-[10px] block">Калории</span>
                <strong className="text-[#B86B3E] text-xs font-black">{item.calories}</strong>
                <span className="text-[9px] text-[#A8A095] block">ккал</span>
              </div>
              <div className="bg-[#FBF9F5] rounded-xl p-2 border border-[#EFE9E0]">
                <span className="text-[#8C7A6B] text-[10px] block">Белки</span>
                <strong className="text-[#24211D] text-xs font-bold">{item.proteins}</strong>
                <span className="text-[9px] text-[#A8A095] block">г</span>
              </div>
              <div className="bg-[#FBF9F5] rounded-xl p-2 border border-[#EFE9E0]">
                <span className="text-[#8C7A6B] text-[10px] block">Жиры</span>
                <strong className="text-[#24211D] text-xs font-bold">{item.fats}</strong>
                <span className="text-[9px] text-[#A8A095] block">г</span>
              </div>
              <div className="bg-[#FBF9F5] rounded-xl p-2 border border-[#EFE9E0]">
                <span className="text-[#8C7A6B] text-[10px] block">Углеводы</span>
                <strong className="text-[#24211D] text-xs font-bold">{item.carbs}</strong>
                <span className="text-[9px] text-[#A8A095] block">г</span>
              </div>
            </div>
          </div>

          {/* Аллергены */}
          {item.allergens.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#7E766D] bg-[#F4EBE3]/50 p-2.5 rounded-xl border border-[#E8DDD2]">
              <AlertCircle className="w-4 h-4 text-[#B86B3E] shrink-0" />
              <span>
                Содержит аллергены:{' '}
                <strong className="text-[#24211D] font-semibold">
                  {item.allergens.join(', ')}
                </strong>
              </span>
            </div>
          )}

          {/* Группы модификаторов и опций */}
          {item.optionGroups && item.optionGroups.length > 0 && (
            <div className="space-y-4">
              {item.optionGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <h4 className="text-xs font-bold text-[#24211D] uppercase tracking-wider flex items-center justify-between">
                    <span>{group.title}</span>
                    <span className="text-[10px] text-[#8C7A6B] font-normal">
                      {group.multiple ? 'несколько вариантов' : 'один вариант'}
                    </span>
                  </h4>
                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isChecked = selectedOptions.some((o) => o.optionId === opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            handleOptionToggle(group.id, group.title, opt, group.multiple)
                          }
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs transition-all ${
                            isChecked
                              ? 'bg-[#F4EBE3] border-[#B86B3E] text-[#24211D] shadow-sm'
                              : 'bg-white border-[#EFE9E0] text-[#4A433B] hover:border-[#DFD5C7]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                                isChecked
                              ? 'bg-[#B86B3E] border-[#B86B3E] text-white font-bold'
                              : 'border-[#D5CDC3]'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="font-semibold">{opt.name}</span>
                          </div>
                          <span className="font-bold text-[#B86B3E]">
                            +{opt.price} {cafeInfo.currency}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Комментарий для кухни */}
          <div>
            <label
              htmlFor="dish-comment"
              className="text-xs font-bold text-[#24211D] uppercase tracking-wider block mb-1.5"
            >
              Пожелание к блюду для кухни
            </label>
            <input
              id="dish-comment"
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: без сахара, погорячее..."
              className="w-full bg-white border border-[#EFE9E0] rounded-2xl px-3.5 py-2.5 text-xs text-[#24211D] placeholder-[#A8A095] outline-none focus:border-[#B86B3E] transition-all"
            />
          </div>

          {/* AI-Upsell: С этим блюдом идеально сочетается */}
          {recommendedDishes.length > 0 && (
            <div className="bg-[#F4EBE3]/60 border border-[#E8DDD2] rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B86B3E]">
                <Sparkles className="w-3.5 h-3.5 text-[#B86B3E]" />
                <span>Идеально дополнит ваш выбор</span>
              </div>
              <div className="space-y-2">
                {recommendedDishes.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#EFE9E0] shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={rec.imageUrl}
                        alt={rec.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-[#24211D] truncate">
                          {rec.name}
                        </h5>
                        <span className="text-xs text-[#B86B3E] font-bold">
                          {rec.price} {cafeInfo.currency}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(rec)}
                      className="flex items-center gap-1 bg-[#F4EBE3] hover:bg-[#B86B3E] text-[#B86B3E] hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E8DDD2] transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Закрепленный футер с итоговой ценой */}
        <div className="p-4 bg-white border-t border-[#EFE9E0] flex items-center justify-between gap-3 shadow-[0_-2px_10px_rgba(40,30,20,0.03)]">
          <div>
            <span className="text-[10px] text-[#8C7A6B] uppercase tracking-wider block font-semibold">
              Стоимость порции
            </span>
            <span className="text-lg font-black text-[#24211D]">
              {finalUnitPrice} {cafeInfo.currency}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddAndClose}
            className="flex-1 bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white font-bold text-sm py-3 px-5 rounded-2xl shadow-md transition-all text-center flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Добавить в заказ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
