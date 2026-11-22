'use client';

import React, { useState } from 'react';
import { useMenu } from '@/context/MenuContext';
import { WaiterCallReason } from '@/types/menu';
import { X, Receipt, HelpCircle, Utensils, Sparkles, CheckCircle2 } from 'lucide-react';

export function WaiterCallModal(): React.JSX.Element | null {
  const { activeModal, setActiveModal, tableNumber, callWaiter, t } = useMenu();
  const [calledSuccess, setCalledSuccess] = useState<string | null>(null);

  if (activeModal !== 'waiter') return null;

  const callOptions: readonly {
    reason: WaiterCallReason;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      reason: 'bill',
      title: t('waiterReasonBill'),
      description: t('waiterReasonBillDesc'),
      icon: <Receipt className="w-5 h-5 text-[#B86B3E]" />,
    },
    {
      reason: 'help',
      title: t('waiterReasonHelp'),
      description: t('waiterReasonHelpDesc'),
      icon: <HelpCircle className="w-5 h-5 text-[#356BB3]" />,
    },
    {
      reason: 'cutlery',
      title: t('waiterReasonCutlery'),
      description: t('waiterReasonCutleryDesc'),
      icon: <Utensils className="w-5 h-5 text-[#2F6B42]" />,
    },
    {
      reason: 'clean',
      title: t('waiterReasonClean'),
      description: t('waiterReasonCleanDesc'),
      icon: <Sparkles className="w-5 h-5 text-[#7A4B85]" />,
    },
  ];

  const handleSelectOption = (reason: WaiterCallReason, title: string): void => {
    callWaiter(reason);
    setCalledSuccess(title);
    setTimeout(() => {
      setCalledSuccess(null);
      setActiveModal(null);
    }, 2200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-sm bg-[#FBF9F5] border border-[#EFE9E0] rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-1.5 text-[#A8A095] hover:text-[#24211D] transition-colors cursor-pointer"
          title={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        {calledSuccess ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-[#2F6B42] animate-bounce" />
            <h3 className="text-lg font-black text-[#24211D]">{t('waiterCallSuccess')}</h3>
            <p className="text-xs text-[#7E766D] max-w-xs leading-relaxed">
              «<strong className="text-[#B86B3E] font-bold">{calledSuccess}</strong>» —{' '}
              {t('waiterCallSuccessDesc')} ({t('tableNumberPrefix')}{tableNumber}).
            </p>
          </div>
        ) : (
          <>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#B86B3E] tracking-wider block">
                {t('waiterCallTitle')}
              </span>
              <h3 className="text-base font-black text-[#24211D] mt-0.5">
                {t('tableNumberPrefix')}{tableNumber}
              </h3>
              <p className="text-xs text-[#7E766D] mt-1">
                {t('waiterCallSubtitle')}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {callOptions.map((opt) => (
                <button
                  key={opt.reason}
                  type="button"
                  onClick={() => handleSelectOption(opt.reason, opt.title)}
                  className="w-full flex items-center gap-3 p-3.5 bg-white hover:bg-[#F4EBE3] border border-[#EFE9E0] hover:border-[#E8DDD2] rounded-2xl text-left transition-all active:scale-95 group shadow-[0_1px_4px_rgba(40,30,20,0.02)] cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#FBF9F5] border border-[#EFE9E0] group-hover:scale-105 transition-transform">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#24211D] group-hover:text-[#B86B3E] transition-colors">
                      {opt.title}
                    </h4>
                    <p className="text-[11px] text-[#7E766D] truncate mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
