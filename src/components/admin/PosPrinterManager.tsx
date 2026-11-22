'use client';

import React, { useState, useEffect } from 'react';
import { useMenu } from '@/context/MenuContext';
import {
  PosConfig,
  PrinterConfig,
  PosSyncLog,
  PosProviderType,
  EscPosTicketResult,
} from '@/types/pos';
import {
  Server,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Settings2,
  Clock,
  Save,
  Radio,
  Zap,
} from 'lucide-react';

export function PosPrinterManager(): React.JSX.Element {
  const { orders } = useMenu();

  const [posConfig, setPosConfig] = useState<PosConfig>({
    provider: 'iiko',
    apiUrl: 'https://api-ru.iiko.services',
    apiKey: 'demo_iiko_api_key_bishkek_2026',
    organizationId: 'org-aura-cafe-kg-001',
    terminalGroupId: 'tg-kitchen-01',
    autoSendOrders: true,
    autoSyncStopList: true,
    isConnected: true,
  });

  const [printers, setPrinters] = useState<readonly PrinterConfig[]>([]);
  const [logs, setLogs] = useState<readonly PosSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    let ignore = false;

    const loadInitialData = async (): Promise<void> => {
      try {
        const [cfgRes, logsRes] = await Promise.all([
          fetch('/api/pos/config'),
          fetch('/api/pos/logs'),
        ]);

        if (cfgRes.ok) {
          const cfgData = await cfgRes.json();
          if (!ignore) {
            if (cfgData.config) setPosConfig(cfgData.config);
            if (cfgData.printers) setPrinters(cfgData.printers);
          }
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (!ignore && logsData.logs) {
            setLogs(logsData.logs);
          }
        }
      } catch {
        // Игнорируем сетевые сбои
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  // Обновление конфигурации и журнала логов
  const refreshData = async (): Promise<void> => {
    try {
      const [cfgRes, logsRes] = await Promise.all([
        fetch('/api/pos/config'),
        fetch('/api/pos/logs'),
      ]);

      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.config) setPosConfig(cfgData.config);
        if (cfgData.printers) setPrinters(cfgData.printers);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs) setLogs(logsData.logs);
      }
    } catch {
      // Игнорируем сетевые сбои
    }
  };

  // Сохранение настроек
  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      const res = await fetch('/api/pos/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posConfig }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        void refreshData();
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  // Синхронизация меню и остатков
  const handleSyncMenu = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/pos/sync-menu', { method: 'POST' });
      if (res.ok) {
        void refreshData();
      }
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  };

  // Тестовая печать кухонного бегунка
  const handleTestPrint = async (printerId?: string) => {
    try {
      setIsPrinting(true);
      setTicketPreview(null);

      // Берем самый свежий заказ или фиктивный заказ столика №4
      const targetOrder = orders[0] ?? {
        id: `ord-test-${Date.now().toString(36)}`,
        tableNumber: 4,
        items: [
          {
            cartItemId: 'test-1',
            menuItem: {
              id: 'test-dish',
              name: 'Иссык-кульская форель на углях',
              price: 680,
            },
            quantity: 2,
            selectedOptions: [
              {
                groupId: 'opt-1',
                groupTitle: 'Степень прожарки',
                optionId: 'med',
                optionName: 'Средняя',
                price: 0,
              },
            ],
            unitPrice: 680,
          },
          {
            cartItemId: 'test-2',
            menuItem: {
              id: 'test-tea',
              name: 'Горный чай с чабрецом',
              price: 220,
            },
            quantity: 1,
            selectedOptions: [],
            unitPrice: 220,
          },
        ],
        totalAmount: 1580,
        discountAmount: 0,
        tipAmount: 150,
        finalAmount: 1730,
        paymentMethod: 'elqr',
        status: 'paid',
        guestComment: 'Подать с горячим хлебом и лимоном',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/printer/print-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: targetOrder.id,
          printerId,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as EscPosTicketResult;
        setTicketPreview(data.textPreview);
        void refreshData();
      }
    } catch {
      // ignore
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[#7E766D] flex flex-col items-center justify-center gap-2">
        <RotateCw className="w-6 h-6 animate-spin text-[#B86B3E]" />
        <span>Загрузка кассовых шлюзов и конфигурации оборудования...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Шапка раздела */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#B86B3E]" />
            <span>Кассовые системы (POS) & Сетевая термопечать бегунков</span>
          </h2>
          <p className="text-xs text-[#7E766D] mt-0.5">
            Двусторонняя интеграция с iikoCloud, Poster POS, r-keeper и сетевыми принтерами ESC/POS (TCP 9100)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncMenu}
            disabled={isSyncing}
            className="bg-white hover:bg-[#F4EBE3] text-[#24211D] border border-[#EFE9E0] text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B86B3E] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Синхронизация...' : 'Синхронизировать меню из кассы'}</span>
          </button>
        </div>
      </div>

      {/* Панель статуса подключения */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF5ED] border border-[#2F6B42]/20 flex items-center justify-center text-[#2F6B42]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] block">Шлюз POS</span>
            <strong className="text-sm font-black text-[#24211D] block">
              {posConfig.provider.toUpperCase()} API
            </strong>
            <span className="text-[10px] text-[#2F6B42] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B42] animate-pulse" />
              Подключено (Пинг 28мс)
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F4EBE3] border border-[#B86B3E]/20 flex items-center justify-center text-[#B86B3E]">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] block">Принтеры цехов</span>
            <strong className="text-sm font-black text-[#24211D] block">
              {printers.filter((p) => p.isEnabled).length} активных
            </strong>
            <span className="text-[10px] text-[#7E766D] font-medium">
              ESC/POS порт 9100 (LAN)
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EDF3FA] border border-[#356BB3]/20 flex items-center justify-center text-[#356BB3]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] block">Автопроброс</span>
            <strong className="text-sm font-black text-[#24211D] block">
              {posConfig.autoSendOrders ? 'ВКЛЮЧЕН' : 'РУЧНОЙ'}
            </strong>
            <span className="text-[10px] text-[#7E766D] font-medium">
              Списание по техкартам
            </span>
          </div>
        </div>
      </div>

      {/* Настройка кассовой системы */}
      <div className="bg-white border border-[#EFE9E0] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
          <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-[#B86B3E]" />
            <span>Настройка провайдера кассы (POS)</span>
          </h3>
          {saveSuccess && (
            <span className="text-xs text-[#2F6B42] font-bold flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" /> Настройки сохранены!
            </span>
          )}
        </div>

        {/* Выбор провайдера */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'iiko', title: 'iikoCloud', desc: 'Бишкек / Рестораны' },
              { id: 'poster', title: 'Poster POS', desc: 'Кофейни / Планшет' },
              { id: 'rkeeper', title: 'r-keeper', desc: 'Классическая касса' },
              { id: 'autonomous', title: 'Автономно', desc: 'Встроенный склад' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setPosConfig((prev) => ({ ...prev, provider: item.id as PosProviderType }))
              }
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                posConfig.provider === item.id
                  ? 'bg-[#F4EBE3] border-[#B86B3E] shadow-sm'
                  : 'bg-[#FBF9F5] border-[#EFE9E0] hover:border-[#DFD5C7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#24211D]">{item.title}</span>
                <Radio
                  className={`w-3.5 h-3.5 ${
                    posConfig.provider === item.id ? 'text-[#B86B3E]' : 'text-[#A8A095]'
                  }`}
                />
              </div>
              <span className="text-[10px] text-[#7E766D] mt-0.5 block">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Параметры подключения */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-[#8C7A6B] block mb-1">
              API Server URL
            </label>
            <input
              type="text"
              value={posConfig.apiUrl}
              onChange={(e) => setPosConfig({ ...posConfig, apiUrl: e.target.value })}
              className="w-full bg-[#FBF9F5] border border-[#EFE9E0] rounded-xl px-3 py-2 text-xs text-[#24211D] outline-none focus:border-[#B86B3E]"
              placeholder="https://api-ru.iiko.services"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8C7A6B] block mb-1">
              API Key / Токен авторизации
            </label>
            <input
              type="password"
              value={posConfig.apiKey}
              onChange={(e) => setPosConfig({ ...posConfig, apiKey: e.target.value })}
              className="w-full bg-[#FBF9F5] border border-[#EFE9E0] rounded-xl px-3 py-2 text-xs text-[#24211D] outline-none focus:border-[#B86B3E]"
              placeholder="••••••••••••••••••••••••"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8C7A6B] block mb-1">
              Organization ID (Торговая точка)
            </label>
            <input
              type="text"
              value={posConfig.organizationId}
              onChange={(e) => setPosConfig({ ...posConfig, organizationId: e.target.value })}
              className="w-full bg-[#FBF9F5] border border-[#EFE9E0] rounded-xl px-3 py-2 text-xs text-[#24211D] outline-none focus:border-[#B86B3E]"
              placeholder="org-aura-cafe-kg-001"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8C7A6B] block mb-1">
              Terminal Group ID (Терминал кухни)
            </label>
            <input
              type="text"
              value={posConfig.terminalGroupId}
              onChange={(e) => setPosConfig({ ...posConfig, terminalGroupId: e.target.value })}
              className="w-full bg-[#FBF9F5] border border-[#EFE9E0] rounded-xl px-3 py-2 text-xs text-[#24211D] outline-none focus:border-[#B86B3E]"
              placeholder="tg-kitchen-01"
            />
          </div>
        </div>

        {/* Чекбоксы автоматизации */}
        <div className="flex flex-col sm:flex-row gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24211D]">
            <input
              type="checkbox"
              checked={posConfig.autoSendOrders}
              onChange={(e) =>
                setPosConfig({ ...posConfig, autoSendOrders: e.target.checked })
              }
              className="w-4 h-4 accent-[#B86B3E] rounded"
            />
            <span>Автоматически пробрасывать новые заказы со столиков в кассу</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24211D]">
            <input
              type="checkbox"
              checked={posConfig.autoSyncStopList}
              onChange={(e) =>
                setPosConfig({ ...posConfig, autoSyncStopList: e.target.checked })
              }
              className="w-4 h-4 accent-[#B86B3E] rounded"
            />
            <span>Автоматически синхронизировать стоп-лист при нулевом остатке</span>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="bg-[#B86B3E] hover:bg-[#A3592E] text-white text-xs font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Сохранение...' : 'Сохранить настройки кассы'}</span>
          </button>
        </div>
      </div>

      {/* Оборудование: Термопринтеры кухни (ESC/POS) */}
      <div className="bg-white border border-[#EFE9E0] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-[#B86B3E]" />
              <span>Сетевые термопринтеры бегунков кухни (ESC/POS)</span>
            </h3>
            <p className="text-[11px] text-[#7E766D] mt-0.5">
              Прямая печать через сокет TCP/IP (порт 9100) на термоленту 80мм / 58мм
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleTestPrint()}
            disabled={isPrinting}
            className="bg-[#2F6B42] hover:bg-[#255734] text-white text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isPrinting ? 'animate-spin' : ''}`} />
            <span>{isPrinting ? 'Печать бегунка...' : '⚡ Тестовая печать бегунка'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {printers.map((prn) => (
            <div
              key={prn.id}
              className="bg-[#FBF9F5] border border-[#EFE9E0] rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#EFE9E0] flex items-center justify-center text-[#B86B3E]">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#24211D]">{prn.name}</h4>
                    <span className="text-[10px] text-[#7E766D] font-mono">
                      {prn.ipAddress}:{prn.port}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    prn.isEnabled
                      ? 'bg-[#EBF5ED] text-[#2F6B42]'
                      : 'bg-[#F4EBE3] text-[#7E766D]'
                  }`}
                >
                  {prn.isEnabled ? 'Активен' : 'Отключен'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] text-[#7E766D] bg-white p-2 rounded-xl border border-[#EFE9E0]">
                <div>
                  <span className="block text-[#A8A095]">Ширина ленты</span>
                  <span className="font-bold text-[#24211D]">{prn.paperWidth}</span>
                </div>
                <div>
                  <span className="block text-[#A8A095]">Автоотрезка</span>
                  <span className="font-bold text-[#24211D]">
                    {prn.autoCut ? 'Включена' : 'Нет'}
                  </span>
                </div>
                <div>
                  <span className="block text-[#A8A095]">Цех</span>
                  <span className="font-bold text-[#24211D]">
                    {prn.department === 'kitchen' ? 'Кухня' : 'Бар'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestPrint(prn.id)}
                  disabled={isPrinting}
                  className="text-[11px] font-bold text-[#B86B3E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-[#B86B3E]" />
                  <span>Проверить печать</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Визуальное превью напечатанной термо-ленты */}
        {ticketPreview && (
          <div className="mt-4 p-4 bg-[#24211D] text-[#FBF9F5] rounded-2xl shadow-inner font-mono text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[10px] text-[#A8A095] border-b border-white/10 pb-2">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#2F6B42]" />
                <span>Эмулятор термопринтера (Предпросмотр чека-бегунка кухни)</span>
              </span>
              <button
                type="button"
                onClick={() => setTicketPreview(null)}
                className="hover:text-white"
              >
                Закрыть превью ✕
              </button>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-[#E8DDD2] max-h-60 overflow-y-auto">
              {ticketPreview}
            </pre>
          </div>
        )}
      </div>

      {/* Журнал событий синхронизации (Logs) */}
      <div className="bg-white border border-[#EFE9E0] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
          <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#B86B3E]" />
            <span>Журнал синхронизации с кассой и принтерами ({logs.length})</span>
          </h3>
          <button
            type="button"
            onClick={refreshData}
            className="text-[11px] font-bold text-[#7E766D] hover:text-[#24211D] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Обновить лог</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#7E766D]">
            Событий интеграции пока нет. Они появятся при оформлении заказов и печати.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-[#FBF9F5] border border-[#EFE9E0] rounded-xl p-3 text-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6B42] shrink-0" />
                    )}
                    {log.status === 'warning' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#E5A93C] shrink-0" />
                    )}
                    {log.status === 'error' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#B83A4A] shrink-0" />
                    )}
                    <span className="font-bold text-[#24211D]">{log.message}</span>
                  </div>
                  {log.details && (
                    <p className="text-[10px] text-[#7E766D] pl-5.5 font-mono">{log.details}</p>
                  )}
                </div>

                <span className="text-[10px] font-mono text-[#A8A095] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
