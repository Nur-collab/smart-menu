'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isIos] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    return isIosDevice && isSafari;
  });
  const [showIosInstructions, setShowIosInstructions] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed previously in this session
    const isDismissed = sessionStorage.getItem('aura_pwa_dismissed');
    if (isDismissed) return;

    // Check if already in standalone mode (installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
    if (isStandalone) return;

    // Detect iOS Safari: show prompt after 5 seconds of browsing
    if (isIos) {
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    }

    // Android / Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event): void => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [isIos]);

  const handleInstallClick = async (): Promise<void> => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('[PWA] Пользователь установил приложение Aura Menu');
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = (): void => {
    setIsVisible(false);
    sessionStorage.setItem('aura_pwa_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Установка приложения на главный экран" className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-[#FFFFFF] border border-[#EAE3D2] rounded-2xl shadow-xl p-4 transition-all animate-slideUp">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>

        <div className="flex-1 pr-4">
          <h4 className="font-semibold text-sm text-[#24211D]">
            Установить приложение Aura Menu
          </h4>
          <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
            Мгновенный доступ со столика без интернета и быстрый вызов официанта в 1 касание.
          </p>

          {showIosInstructions ? (
            <div className="mt-3 p-2.5 rounded-lg bg-[#FAF7F2] border border-[#EAE3D2] text-xs text-[#57534E] space-y-1">
              <p className="font-medium text-[#24211D] flex items-center gap-1.5">
                <Share className="w-3.5 h-3.5 text-amber-700 inline" /> Инструкция для iPhone:
              </p>
              <p>1. Нажмите иконку <strong>«Поделиться»</strong> внизу Safari.</p>
              <p>2. Выберите <strong>«На экран Домой»</strong> ⊞.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Установить</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-lg text-xs text-[#78716C] hover:text-[#24211D] hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Позже
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors cursor-pointer -mr-1 -mt-1"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
