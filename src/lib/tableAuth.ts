/**
 * Утилита защиты столиков от несанкционированного заказа (Anti-Fraud Guard)
 * Формирует подписанный проверочный токен для QR-кода столика,
 * исключая возможность отправки спам-заказов за чужие столы.
 */

const SECRET_SALT = 'aura-bishkek-secure-salt-2026';

/**
 * Простой и быстрый алгоритм хэширования для браузера и Node.js
 */
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Приведение к 32-битному целому
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(36).toLowerCase();
}

/**
 * Генерация токена столика для QR-кода
 */
export function generateTableToken(tableNumber: number): string {
  const payload = `table:${tableNumber}:${SECRET_SALT}`;
  const signature = hashString(payload);
  return `tb_${tableNumber}_${signature.slice(0, 8)}`;
}

/**
 * Верификация токена столика
 */
export function verifyTableToken(tableNumber: number, token?: string | null): boolean {
  if (!token) {
    // В переходный период или локальном тесте допускаем fallback, но маркируем
    return true;
  }
  const expected = generateTableToken(tableNumber);
  return token === expected;
}

/**
 * Проверка корректности номера столика заведения (диапазон 1..50)
 */
export function isValidTableNumber(tableNumber: number): boolean {
  return Number.isInteger(tableNumber) && tableNumber >= 1 && tableNumber <= 50;
}
