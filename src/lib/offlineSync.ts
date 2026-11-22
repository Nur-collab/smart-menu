// Движок оффлайн-синхронизации и очереди запросов (Bishkek Smart Menu Offline Engine)

export type OfflineActionType = 'CALL_WAITER' | 'CREATE_ORDER' | 'GENERIC_MUTATION';

export interface OfflineAction {
  readonly id: string;
  readonly type: OfflineActionType;
  readonly endpoint: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
  readonly retryCount: number;
  readonly description: string;
}

const STORAGE_KEY = 'smart_menu_offline_queue_v1';

/**
 * Получить текущий список отложенных действий из LocalStorage
 */
export function getPendingOfflineActions(): readonly OfflineAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineAction[]) : [];
  } catch (err) {
    console.error('[offlineSync] Ошибка чтения оффлайн-очереди:', err);
    return [];
  }
}

/**
 * Сохранить список действий
 */
function savePendingActions(actions: readonly OfflineAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    notifyQueueListeners(actions);
  } catch (err) {
    console.error('[offlineSync] Ошибка записи в оффлайн-очередь:', err);
  }
}

/**
 * Добавить действие в оффлайн-очередь
 */
export function enqueueOfflineAction(
  type: OfflineActionType,
  endpoint: string,
  payload: Record<string, unknown>,
  description: string
): OfflineAction {
  const newAction: OfflineAction = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    endpoint,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    description,
  };

  const current = getPendingOfflineActions();
  savePendingActions([...current, newAction]);
  return newAction;
}

/**
 * Удалить действие из очереди по ID
 */
export function removeOfflineAction(id: string): void {
  const current = getPendingOfflineActions();
  savePendingActions(current.filter((item) => item.id !== id));
}

/**
 * Проверить реальный сетевой статус
 */
export function checkIsOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

type StatusListener = (isOnline: boolean) => void;
type QueueListener = (actions: readonly OfflineAction[]) => void;

const statusListeners = new Set<StatusListener>();
const queueListeners = new Set<QueueListener>();

function notifyQueueListeners(actions: readonly OfflineAction[]): void {
  queueListeners.forEach((listener) => {
    try {
      listener(actions);
    } catch (e) {
      console.error(e);
    }
  });
}

/**
 * Подписка на изменение сетевого статуса (online / offline)
 */
export function subscribeToNetworkStatus(callback: StatusListener): () => void {
  statusListeners.add(callback);

  if (typeof window !== 'undefined') {
    const handleOnline = (): void => {
      callback(true);
      // При появлении интернета сразу пытаемся синхронизировать накопленные действия
      syncPendingOfflineQueue().catch(console.error);
    };
    const handleOffline = (): void => {
      callback(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      statusListeners.delete(callback);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  return () => {
    statusListeners.delete(callback);
  };
}

/**
 * Подписка на обновление состава оффлайн-очереди
 */
export function subscribeToOfflineQueue(callback: QueueListener): () => void {
  queueListeners.add(callback);
  return () => {
    queueListeners.delete(callback);
  };
}

/**
 * Фоновая синхронизация всех отложенных запросов на сервер
 */
export async function syncPendingOfflineQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const actions = getPendingOfflineActions();
  if (actions.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[offlineSync] Запуск синхронизации ${actions.length} отложенных действий...`);
  let synced = 0;
  let failed = 0;
  const remainingActions: OfflineAction[] = [];

  for (const action of actions) {
    try {
      const response = await fetch(action.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Synced': 'true',
          'X-Original-Timestamp': String(action.timestamp),
        },
        body: JSON.stringify(action.payload),
      });

      if (response.ok) {
        synced++;
        console.log(`[offlineSync] Действие ${action.id} (${action.description}) успешно передано на сервер.`);
      } else {
        // Ошибка сервера (4xx/5xx) — инкрементируем попытки
        failed++;
        if (action.retryCount < 5) {
          remainingActions.push({
            ...action,
            retryCount: action.retryCount + 1,
          });
        }
      }
    } catch {
      failed++;
      remainingActions.push({
        ...action,
        retryCount: action.retryCount + 1,
      });
    }
  }

  savePendingActions(remainingActions);
  return { synced, failed };
}
