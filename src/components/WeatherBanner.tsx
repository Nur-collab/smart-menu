'use client';

import React from 'react';
import { useMenu } from '@/context/MenuContext';
import { Sun, CloudRain, Wind, Plus, Flame } from 'lucide-react';
import { getLocalizedName } from '@/lib/i18n';

export function WeatherBanner(): React.JSX.Element | null {
  const {
    cafeInfo,
    items,
    addToCart,
    stopList,
    weatherType,
    setWeatherType,
    getItemPriceWithDiscount,
    t,
    language,
  } = useMenu();

  // Ищем блюдо с привязкой к текущей погоде (солнце/дождь/прохлада)
  const weatherDish =
    items.find((item) => item.weatherAffinity === weatherType && !stopList.has(item.id)) ??
    items.find((item) => item.badges.includes('hit') && !stopList.has(item.id));

  if (!weatherDish) {
    return null;
  }

  const priceInfo = getItemPriceWithDiscount(weatherDish);
  const localizedDishName = getLocalizedName(weatherDish, language);

  const getWeatherTitle = (): string => {
    switch (weatherType) {
      case 'sunny':
        return t('sunnyWeather');
      case 'cold':
        return t('coldWeather');
      case 'rain':
      default:
        return t('rainWeather');
    }
  };

  const getWeatherIcon = (): React.JSX.Element => {
    switch (weatherType) {
      case 'sunny':
        return <Sun className="w-3.5 h-3.5 text-[#B87D2E]" />;
      case 'cold':
        return <Wind className="w-3.5 h-3.5 text-[#356BB3]" />;
      case 'rain':
      default:
        return <CloudRain className="w-3.5 h-3.5 text-[#B86B3E]" />;
    }
  };

  const tryPrefix =
    language === 'en' ? 'Try: ' : language === 'kg' ? 'Даамын татыңыз: ' : 'Попробуйте: ';

  return (
    <div className="mx-4 mt-3 max-w-4xl sm:mx-auto rounded-3xl bg-[#F4EBE2] border border-[#E5D7CA] p-4 shadow-[0_2px_12px_rgba(40,30,20,0.03)] relative overflow-hidden transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#B86B3E]">
              {getWeatherIcon()}
              <span>{t('weatherRecommend')}</span>
            </div>

            {/* Компактный переключатель погоды */}
            <div className="flex items-center bg-white/70 border border-[#E8DDD2] p-0.5 rounded-xl text-[10px]">
              <button
                type="button"
                onClick={() => setWeatherType('sunny')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  weatherType === 'sunny' ? 'bg-[#24211D] text-white' : 'text-[#7E766D]'
                }`}
                title={language === 'en' ? 'Sunny in Bishkek (+26°C)' : language === 'kg' ? 'Бишкекте ачык күн (+26°C)' : 'Солнечно в Бишкеке (+26°C)'}
              >
                {language === 'en' ? '☀️ Sun' : language === 'kg' ? '☀️ Күн' : '☀️ Солнце'}
              </button>
              <button
                type="button"
                onClick={() => setWeatherType('rain')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  weatherType === 'rain' ? 'bg-[#24211D] text-white' : 'text-[#7E766D]'
                }`}
                title={language === 'en' ? 'Rainy in Bishkek (+15°C)' : language === 'kg' ? 'Бишкекте жамгыр (+15°C)' : 'Дождь в Бишкеке (+15°C)'}
              >
                {language === 'en' ? '🌧️ Rain' : language === 'kg' ? '🌧️ Жамгыр' : '🌧️ Дождь'}
              </button>
              <button
                type="button"
                onClick={() => setWeatherType('cold')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  weatherType === 'cold' ? 'bg-[#24211D] text-white' : 'text-[#7E766D]'
                }`}
                title={language === 'en' ? 'Mountain breeze (+10°C)' : language === 'kg' ? 'Тоодон соккон жел (+10°C)' : 'Свежий горный бриз (+10°C)'}
              >
                {language === 'en' ? '🌬️ Breeze' : language === 'kg' ? '🌬️ Салкын' : '🌬️ Бриз'}
              </button>
            </div>
          </div>

          <p className="text-[#4A433B] text-xs leading-relaxed">
            {getWeatherTitle()}{' '}
            <strong className="text-[#24211D] font-bold block sm:inline mt-0.5 sm:mt-0">
              {tryPrefix}{localizedDishName}!
            </strong>
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-black text-[#24211D]">
              {priceInfo.currentPrice} {cafeInfo.currency}
            </span>
            {(priceInfo.isHappyHoursDiscount || weatherDish.oldPrice) && (
              <span className="text-xs text-[#9E958A] line-through font-medium">
                {priceInfo.originalPrice} {cafeInfo.currency}
              </span>
            )}
            <span className="text-[10px] bg-[#E8DDD2] text-[#8C5E3A] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-[#B86B3E]" /> {t('badgeHit')}
            </span>
            {priceInfo.isHappyHoursDiscount && (
              <span className="text-[10px] bg-[#24211D] text-[#E39666] px-2 py-0.5 rounded-full font-bold">
                🌙 -20%
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => addToCart(weatherDish)}
          className="self-stretch sm:self-center flex items-center justify-center gap-1.5 bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('addToCart')}</span>
        </button>
      </div>
    </div>
  );
}
