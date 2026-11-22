'use client';

import React, { useEffect } from 'react';
import { OfflineBanner } from './OfflineBanner';
import { PwaInstallPrompt } from './PwaInstallPrompt';

export const PwaRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[PWA] Service Worker успешно зарегистрирован. Область:', registration.scope);

            // Обработка обновлений Service Worker
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('[PWA] Доступно обновление меню. Новый кэш готов.');
                    } else {
                      console.log('[PWA] Меню полностью закэшировано для работы оффлайн.');
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.warn('[PWA] Ошибка регистрации Service Worker:', error);
          });
      });
    }
  }, []);

  return (
    <>
      <OfflineBanner />
      <PwaInstallPrompt />
    </>
  );
};
