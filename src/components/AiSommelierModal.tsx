'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useMenu } from '@/context/MenuContext';
import { Sparkles, Send, X, Bot, Plus, Check } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { AiChatMessage, AiRecommendResponse } from '@/types/ai';

let messageSeq = 1000;
function createMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

function getCurrentTimeFormatted(): string {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function AiSommelierModal(): React.JSX.Element | null {
  const {
    activeModal,
    setActiveModal,
    addToCart,
    cart,
    t,
    language,
    getItemPriceWithDiscount,
  } = useMenu();

  const isOpen = activeModal === 'sommelier';

  const defaultGreeting: AiChatMessage = useMemo(
    () => ({
      id: 'msg-init-default',
      role: 'assistant',
      content: t('aiWelcome'),
      timestamp: '12:00',
    }),
    [t]
  );

  const defaultChips: readonly string[] = useMemo(
    () => [t('aiQuickQ1'), t('aiQuickQ2'), t('aiQuickQ3'), t('aiQuickQ4')],
    [t]
  );

  const [messages, setMessages] = useState<readonly AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [customChips, setCustomChips] = useState<readonly string[] | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<ReadonlySet<string>>(new Set<string>());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const effectiveMessages: readonly AiChatMessage[] =
    messages.length === 0 ? [defaultGreeting] : messages;

  const effectiveChips: readonly string[] = customChips ?? defaultChips;

  // Автоскролл к низу диалога при появлении новых сообщений
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isThinking, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string): Promise<void> => {
    const query = textToSend.trim();
    if (!query || isThinking) return;

    const time = getCurrentTimeFormatted();
    const userMsg: AiChatMessage = {
      id: createMessageId('msg-user'),
      role: 'user',
      content: query,
      timestamp: time,
    };

    setMessages((prev) => (prev.length === 0 ? [defaultGreeting, userMsg] : [...prev, userMsg]));
    setInputValue('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          cartItemIds: cart.map((c) => c.menuItem.id),
          language,
        }),
      });

      const replyTime = getCurrentTimeFormatted();

      if (res.ok) {
        const data = (await res.json()) as AiRecommendResponse;
        const assistantMsg: AiChatMessage = {
          id: createMessageId('msg-ai'),
          role: 'assistant',
          content: data.reply,
          timestamp: replyTime,
          recommendedItemIds: data.recommendedItems.map((i) => i.id),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.quickPrompts && data.quickPrompts.length > 0) {
          setCustomChips(data.quickPrompts);
        }
      } else {
        const fallbackMsg: AiChatMessage = {
          id: createMessageId('msg-ai-err'),
          role: 'assistant',
          content:
            language === 'kg'
              ? 'Кечиресиз, сурооңузду кайталап коёсузбу? Менюбуздан эң даамдуусун тандап берейин.'
              : language === 'en'
              ? 'Could you please repeat your question? I would love to pick the best pairings for you.'
              : 'Прошу прощения, немного задумалась! Расскажите, что именно вы хотели бы попробовать сегодня?',
          timestamp: replyTime,
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const networkErrorMsg: AiChatMessage = {
        id: createMessageId('msg-ai-net'),
        role: 'assistant',
        content:
          language === 'kg'
            ? 'Байланыш үзгүлтүккө учурады. Сурооңузду кайра жиберип көрүңүз.'
            : language === 'en'
            ? 'Network glitch. Please try asking again.'
            : 'Кажется, возникла заминка со связью. Попробуйте нажать кнопку еще раз!',
        timestamp: getCurrentTimeFormatted(),
      };
      setMessages((prev) => [...prev, networkErrorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAddToCart = (item: MenuItem): void => {
    addToCart(item);
    setAddedItemIds((prev) => new Set([...prev, item.id]));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FBF9F5] w-full max-w-lg h-[92vh] max-h-[700px] rounded-3xl shadow-2xl flex flex-col border border-[#EFE9E0] overflow-hidden">
        {/* Шапка диалога */}
        <header className="bg-white border-b border-[#EFE9E0] px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#B86B3E] to-[#D98A5B] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-[#24211D] leading-tight">
                  {t('aiSommelierTitle')}
                </h3>
                <span className="w-2 h-2 rounded-full bg-[#2F6B42] animate-pulse" />
              </div>
              <p className="text-[11px] text-[#7E766D]">{t('aiSommelierSubtitle')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-full bg-[#F4EBE3] hover:bg-[#EAE0D5] text-[#7E766D] hover:text-[#24211D] flex items-center justify-center transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Тело чата */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {effectiveMessages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-[#F4EBE3] border border-[#E8DDD2] text-[#B86B3E] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-[#24211D] text-[#FBF9F5] rounded-tr-xs'
                        : 'bg-white text-[#24211D] border border-[#EFE9E0] rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    <span
                      className={`block text-[9px] text-right mt-1.5 ${
                        isUser ? 'text-white/60' : 'text-[#A8A095]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Карточки рекомендуемых блюд */}
                  {msg.recommendedItemIds && msg.recommendedItemIds.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.recommendedItemIds.map((itemId) => (
                        <SommelierDishRecommendationCard
                          key={itemId}
                          itemId={itemId}
                          onAdd={handleAddToCart}
                          isAdded={addedItemIds.has(itemId)}
                          getPrice={getItemPriceWithDiscount}
                          inCart={cart.some((c) => c.menuItem.id === itemId)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Индикатор набора текста / размышления */}
          {isThinking && (
            <div className="flex gap-2.5 items-center text-[#7E766D]">
              <div className="w-7 h-7 rounded-xl bg-[#F4EBE3] border border-[#E8DDD2] text-[#B86B3E] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-[#EFE9E0] px-3.5 py-2 rounded-2xl text-[11px] font-medium text-[#B86B3E] animate-pulse">
                {t('aiThinking')}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Быстрые чипы-подсказки */}
        {effectiveChips.length > 0 && (
          <div className="px-3 py-2 bg-white/70 border-t border-[#EFE9E0] overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {effectiveChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isThinking}
                onClick={() => void handleSendMessage(chip)}
                className="px-3 py-1.5 rounded-full bg-[#F4EBE3] hover:bg-[#EAE0D5] text-[#7E766D] hover:text-[#24211D] border border-[#E8DDD2] text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Поле ввода вопроса */}
        <footer className="p-3 bg-white border-t border-[#EFE9E0] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('aiInputPlaceholder')}
              disabled={isThinking}
              className="flex-1 bg-[#FBF9F5] border border-[#EFE9E0] rounded-2xl px-3.5 py-2.5 text-xs text-[#24211D] placeholder:text-[#A8A095] focus:outline-none focus:border-[#B86B3E] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="w-10 h-10 rounded-2xl bg-[#B86B3E] hover:bg-[#A3592E] disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-sm cursor-pointer"
              title={t('aiSend')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  readonly itemId: string;
  readonly onAdd: (item: MenuItem) => void;
  readonly isAdded: boolean;
  readonly getPrice: (item: MenuItem) => { currentPrice: number; originalPrice: number; isHappyHoursDiscount: boolean };
  readonly inCart: boolean;
}

function SommelierDishRecommendationCard({
  itemId,
  onAdd,
  isAdded,
  getPrice,
  inCart,
}: RecommendationCardProps): React.JSX.Element | null {
  const { items } = useMenu();
  const dish = items.find((i) => i.id === itemId);

  if (!dish) return null;

  const priceInfo = getPrice(dish);

  return (
    <div className="bg-white border border-[#EFE9E0] p-2.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 hover:border-[#B86B3E]/40 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#F4EBE3] shrink-0 border border-[#E8DDD2]">
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#24211D] truncate leading-tight">
            {dish.name}
          </h4>
          <p className="text-[10px] text-[#7E766D] mt-0.5 flex items-center gap-1.5">
            <span>{dish.weight}</span>
            <span>•</span>
            <span>{dish.calories} ккал</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-black text-[#2F6B42]">
              {priceInfo.currentPrice} сом
            </span>
            {priceInfo.isHappyHoursDiscount && (
              <span className="text-[9px] text-[#A8A095] line-through">
                {priceInfo.originalPrice} сом
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAdd(dish)}
        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm ${
          isAdded
            ? 'bg-[#2F6B42] text-white'
            : inCart
            ? 'bg-[#EBF5ED] text-[#2F6B42] border border-[#D5EADB] hover:bg-[#D5EADB]'
            : 'bg-[#B86B3E] hover:bg-[#A3592E] text-white'
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Добавлено</span>
          </>
        ) : inCart ? (
          <>
            <Check className="w-3 h-3" />
            <span>В корзине</span>
          </>
        ) : (
          <>
            <Plus className="w-3 h-3 stroke-[3]" />
            <span>Добавить</span>
          </>
        )}
      </button>
    </div>
  );
}
