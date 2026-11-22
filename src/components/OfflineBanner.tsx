'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudAlert } from 'lucide-react';
import {
  checkIsOnline,
  subscribeToNetworkStatus,
  subscribeToOfflineQueue,
  getPendingOfflineActions,
  syncPendingOfflineQueue,
  OfflineAction,
} from '@/lib/offlineSync';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => checkIsOnline());
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingOfflineActions().length);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubNet = subscribeToNetworkStatus((online) => {
      setIsOnline(online);
      if (online) {
        setSyncNotice('Связь восстановлена! Идет синхронизация...');
        setTimeout(() => setSyncNotice(null), 4000);
      }
    });

    const unsubQueue = subscribeToOfflineQueue((queue: readonly OfflineAction[]) => {
      setPendingCount(queue.length);
    });

    return () => {
      unsubNet();
      unsubQueue();
    };
  }, []);

  const handleManualSync = (): void => {
    startTransition(async () => {
      const result = await syncPendingOfflineQueue();
      if (result.synced > 0) {
        setSyncNotice(`Успешно отправлено: ${result.synced} запросов`);
        setTimeout(() => setSyncNotice(null), 3500);
      }
    });
  };

  // If online and no pending offline actions and no sync notice, don't show banner
  if (isOnline && pendingCount === 0 && !syncNotice) {
    return null;
  }

  return (
    <aside aria-label="Статус сети и оффлайн синхронизации" className="w-full z-40 bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs md:text-sm shadow-sm transition-all animate-fadeIn">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-[#D97706] animate-pulse shrink-0" />
          ) : syncNotice ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <CloudAlert className="w-4 h-4 text-[#D97706] shrink-0" />
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold">
              {!isOnline ? 'Оффлайн-режим:' : syncNotice ? 'Синхронизация:' : 'Локальная очередь:'}
            </span>
            <span className="text-[#B45309]">
              {!isOnline
                ? 'Слабый сигнал. Меню доступно из памяти устройства.'
                : syncNotice || `${pendingCount} запросов ждут отправки на кассу.`}
            </span>
          </div>

          {pendingCount > 0 && !syncNotice && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FDE68A] text-[#78350F]">
              В очереди: {pendingCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {pendingCount > 0 && isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
              <span>{isPending ? 'Отправка...' : 'Отправить сейчас'}</span>
            </button>
          )}

          {!isOnline && (
            <span className="text-xs text-[#78350F] italic opacity-80">
              Отправится автоматически при сети
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
