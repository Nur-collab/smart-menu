'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  StaffMember,
  STAFF_MEMBERS,
  authenticateStaffPin,
} from '@/types/auth';
import {
  Lock,
  Delete,
  ArrowLeft,
  ShieldCheck,
  ChefHat,
  UserCheck,
  Crown,
  AlertCircle,
} from 'lucide-react';

interface PinPadLockScreenProps {
  readonly onAuthenticated: (member: StaffMember) => void;
  readonly cafeName: string;
}

export function PinPadLockScreen({
  onAuthenticated,
  cafeName,
}: PinPadLockScreenProps): React.JSX.Element {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDigitPress = (digit: string): void => {
    if (pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setIsError(false);
    setErrorMessage('');

    if (newPin.length === 4) {
      fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Неверный PIN-код');
          }
          return res.json();
        })
        .then((data: { member: StaffMember; token: string }) => {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.([30, 30, 30]);
          }
          if (data.token) {
            sessionStorage.setItem('aura_staff_token', data.token);
          }
          onAuthenticated(data.member);
        })
        .catch((err: Error) => {
          setIsError(true);
          setErrorMessage(err.message || 'Неверный PIN-код сотрудника');
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.([150, 50, 150]);
          }
          setTimeout(() => {
            setPin('');
            setIsError(false);
          }, 800);
        });
    }
  };

  const handleBackspace = (): void => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setIsError(false);
      setErrorMessage('');
    }
  };

  const handleClear = (): void => {
    setPin('');
    setIsError(false);
    setErrorMessage('');
  };

  const handleQuickDemoFill = (demoPin: string): void => {
    setPin(demoPin);
    setIsError(false);
    const staff = authenticateStaffPin(demoPin);
    if (staff) {
      setTimeout(() => {
        onAuthenticated(staff);
      }, 150);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#24211D] flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
      {/* Верхний бар с кнопкой выхода в зал */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#EFE9E0] text-[#7E766D] hover:text-[#24211D] rounded-2xl text-xs font-bold transition-all shadow-sm hover:border-[#DFD5C7]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#B86B3E]" />
          <span>В меню зала</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A6B] font-semibold bg-[#F4EBE3] px-3 py-1 rounded-full border border-[#E8DDD2]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B86B3E]" />
          <span>Staff Shield v2.0</span>
        </div>
      </header>

      {/* Центральный терминал ввода PIN */}
      <main className="max-w-sm w-full mx-auto my-auto space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-3xl bg-[#F4EBE3] border border-[#E8DDD2] text-[#B86B3E] flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-lg font-black text-[#24211D]">
            Терминал персонала
          </h1>
          <p className="text-xs text-[#7E766D]">
            {cafeName} • Введите персональный 4-значный PIN
          </p>
        </div>

        {/* Индикаторы 4 точек пин-кода */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex items-center justify-center gap-3.5 p-3 rounded-2xl transition-transform ${
              isError ? 'animate-bounce text-[#B83A4A]' : ''
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const filled = index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                    filled
                      ? isError
                        ? 'bg-[#B83A4A] border-[#B83A4A] scale-110'
                        : 'bg-[#B86B3E] border-[#B86B3E] scale-110 shadow-sm'
                      : 'border-[#DFD5C7] bg-white'
                  }`}
                />
              );
            })}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1 text-xs text-[#B83A4A] font-bold animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Цифровая клавиатура (Numpad) */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-16 rounded-2xl bg-white hover:bg-[#F4EBE3] active:scale-95 border border-[#EFE9E0] text-xl font-black text-[#24211D] shadow-[0_2px_8px_rgba(40,30,20,0.03)] transition-all flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-white/70 hover:bg-[#F4EBE3] active:scale-95 border border-[#EFE9E0] text-xs font-bold text-[#8C7A6B] transition-all flex items-center justify-center cursor-pointer"
          >
            Сброс
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-16 rounded-2xl bg-white hover:bg-[#F4EBE3] active:scale-95 border border-[#EFE9E0] text-xl font-black text-[#24211D] shadow-[0_2px_8px_rgba(40,30,20,0.03)] transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Стереть цифру"
            className="h-16 rounded-2xl bg-white/70 hover:bg-[#F4EBE3] active:scale-95 border border-[#EFE9E0] text-[#7E766D] hover:text-[#24211D] transition-all flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Быстрые демо-кнопки переключения ролей */}
        <div className="pt-2 border-t border-[#EFE9E0] space-y-2">
          <span className="text-[10px] font-bold text-[#8C7A6B] block text-center uppercase tracking-wider">
            Быстрый вход для тестирования ролей:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {STAFF_MEMBERS.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleQuickDemoFill(member.pinCode)}
                className="p-2 rounded-xl bg-white hover:bg-[#F4EBE3] border border-[#EFE9E0] text-left transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  {member.role === 'waiter' && <UserCheck className="w-3.5 h-3.5 text-[#B86B3E]" />}
                  {member.role === 'kitchen' && <ChefHat className="w-3.5 h-3.5 text-[#356BB3]" />}
                  {member.role === 'manager' && <Crown className="w-3.5 h-3.5 text-[#B87D2E]" />}
                  <span className="text-[11px] font-black text-[#24211D] truncate">
                    {member.name.split(' ')[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#8C7A6B] mt-0.5">
                  <span className="truncate">{member.roleTitle.split(' ')[0]}</span>
                  <span className="font-mono font-bold text-[#B86B3E]">{member.pinCode}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="text-center text-[11px] text-[#A8A095] max-w-sm w-full mx-auto">
        Aura Digital Menu Security • Защищенный вход персонала заведения
      </footer>
    </div>
  );
}
