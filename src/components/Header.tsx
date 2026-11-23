'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMenu } from '@/context/MenuContext';
import {
  Bell,
  Wifi,
  Check,
  CookingPot,
  MapPin,
  Clock,
  CloudRain,
  Sparkles,
  Percent,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header(): React.JSX.Element {
  const {
    cafeInfo,
    tableNumber,
    setTableNumber,
    setActiveModal,
    waiterCalls,
    orders,
    t,
    openSommelierModal,
    isHappyHoursActive,
    toggleHappyHours,
  } = useMenu();

  const [copiedWifi, setCopiedWifi] = useState<boolean>(false);
  const [isEditingTable, setIsEditingTable] = useState<boolean>(false);
  const [tempTableInput, setTempTableInput] = useState<string>(tableNumber.toString());

  const handleCopyWifi = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(cafeInfo.wifiPass);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2500);
    } catch {
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2500);
    }
  };

  const handleSaveTable = (): void => {
    const parsed = parseInt(tempTableInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 99) {
      setTableNumber(parsed);
    } else {
      setTempTableInput(tableNumber.toString());
    }
    setIsEditingTable(false);
  };

  const pendingWaiterCallsCount = waiterCalls.filter((c) => c.status === 'pending').length;
  const activeOrdersCount = orders.filter(
    (o) =>
      o.status === 'pending' ||
      o.status === 'accepted' ||
      o.status === 'cooking' ||
      o.status === 'ready'
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/90 dark:bg-[#121214]/90 backdrop-blur-md border-b border-[#EFE9E0] dark:border-[#27272A] shadow-[0_1px_8px_rgba(40,30,20,0.03)] transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Верхняя строка: Заведение и Инструменты */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B86B3E] animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#24211D] dark:text-[#F4F4F5]">
                {cafeInfo.name}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#7E766D] dark:text-[#A1A1AA] mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#B86B3E]" />
                {cafeInfo.address}
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#7E766D] dark:text-[#A1A1AA]" />
                {cafeInfo.openHours}
              </span>
            </div>
          </div>

          {/* Правая часть: Язык, Тема, Столик, AI, Официант, KDS */}
          <div className="flex items-center gap-2">
            {/* Переключатель языка (RU / KG / EN) */}
            <LanguageSwitcher />

            {/* Переключатель темного/светлого режима */}
            <ThemeToggle />

            {/* Виджет выбора/отображения столика */}
            <div className="bg-[#F4EBE3] dark:bg-[#27201C] border border-[#E8DDD2] dark:border-[#3D3028] rounded-2xl px-2.5 py-1 text-right">
              <span className="text-[9px] uppercase font-bold text-[#8C7A6B] dark:text-[#A8988B] block tracking-wider leading-none">
                {t('tableLabel')}
              </span>
              {isEditingTable ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={tempTableInput}
                    onChange={(e) => setTempTableInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTable();
                    }}
                    className="w-9 bg-white dark:bg-[#18181B] border border-[#B86B3E] rounded px-1 py-0.5 text-center text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveTable}
                    className="p-1 text-[#B86B3E] hover:text-[#944D24]"
                    title="Сохранить"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTable(true)}
                  className="text-xs sm:text-sm font-extrabold text-[#B86B3E] hover:text-[#944D24] underline decoration-dotted underline-offset-2 flex items-center gap-1 cursor-pointer"
                  title="Нажмите, чтобы изменить номер столика"
                >
                  №{tableNumber}
                </button>
              )}
            </div>

            {/* Кнопка AI-Сомелье */}
            <button
              type="button"
              onClick={openSommelierModal}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#24211D] to-[#3D3730] dark:from-[#27272A] dark:to-[#3F3F46] text-[#FBF9F5] shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              title={t('aiSommelierTitle')}
            >
              <Sparkles className="w-4 h-4 text-[#D98A5B]" />
            </button>

            {/* Кнопка вызова официанта */}
            <button
              type="button"
              onClick={() => setActiveModal('waiter')}
              className="relative p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1F] hover:bg-[#F4EBE3] dark:hover:bg-[#27272A] text-[#24211D] dark:text-[#F4F4F5] border border-[#EFE9E0] dark:border-[#27272A] shadow-sm transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              title={t('callWaiter')}
            >
              <Bell className="w-4 h-4 text-[#B86B3E]" />
              {pendingWaiterCallsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B86B3E] text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {pendingWaiterCallsCount}
                </span>
              )}
            </button>

            {/* Кнопка KDS / Панели персонала */}
            <Link
              href="/admin"
              className="relative p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1F] hover:bg-[#F4EBE3] dark:hover:bg-[#27272A] text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] border border-[#EFE9E0] dark:border-[#27272A] shadow-sm transition-all flex items-center justify-center active:scale-95"
              title="Терминал персонала (KDS & Администратор)"
            >
              <CookingPot className="w-4 h-4 text-[#7E766D] dark:text-[#A1A1AA]" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#24211D] dark:bg-[#F4F4F5] text-[#FBF9F5] dark:text-[#121214] rounded-full text-[10px] font-extrabold flex items-center justify-center">
                  {activeOrdersCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Нижняя быстрая панель: Wi-Fi, Happy Hours переключатель и Погода */}
        <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-[#EFE9E0] dark:border-[#27272A]">
          <button
            type="button"
            onClick={handleCopyWifi}
            className="flex items-center gap-1.5 text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <Wifi className="w-3.5 h-3.5 text-[#B86B3E]" />
            <span>Wi-Fi: <strong className="text-[#24211D] dark:text-[#F4F4F5] font-medium">{cafeInfo.wifiName}</strong></span>
            {copiedWifi ? (
              <span className="text-[#2F6B42] dark:text-[#34D399] text-[11px] font-semibold flex items-center gap-0.5 ml-1">
                <Check className="w-3 h-3" /> {t('wifiCopied')}
              </span>
            ) : (
              <span className="text-[10px] text-[#A8A095] dark:text-[#71717A] ml-1 underline decoration-dashed">
                {t('wifiPassword')}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            {/* Переключатель Happy Hours */}
            <button
              type="button"
              onClick={toggleHappyHours}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                isHappyHoursActive
                  ? 'bg-[#24211D] dark:bg-[#27201C] text-white dark:text-[#E07A43] border-[#38332C] dark:border-[#523A2B] shadow-xs'
                  : 'bg-[#FBF9F5] dark:bg-[#18181B] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#27272A] hover:text-[#24211D] dark:hover:text-[#F4F4F5]'
              }`}
              title={isHappyHoursActive ? 'Happy Hours активны (-20% на десерты)' : 'Включить режим Happy Hours'}
            >
              <Percent className={`w-3 h-3 ${isHappyHoursActive ? 'text-[#E39666]' : 'text-[#B86B3E]'}`} />
              <span>{isHappyHoursActive ? t('happyHoursOn') : t('happyHoursOff')}</span>
            </button>

            <div className="flex items-center gap-2 text-[#7E766D] dark:text-[#A1A1AA]">
              <span className="flex items-center gap-1 text-[#24211D] dark:text-[#F4F4F5] font-medium">
                <CloudRain className="w-3.5 h-3.5 text-[#B86B3E]" />
                +{cafeInfo.currentTemperature}°C
              </span>
              <span className="hidden sm:inline text-[#D5CDC3] dark:text-[#3F3F46]">•</span>
              <span className="hidden sm:inline text-[#7E766D] dark:text-[#A1A1AA]">
                {cafeInfo.cashbackPercent}% {t('cashbackNotice')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
