import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { StaffMember, StaffRole, StaffPermissions, getPermissionsByRole } from '@/types/auth';

const AUTH_SECRET = process.env.AUTH_SECRET || 'aura-server-secret-bishkek-2026';

// Серверный список сотрудников и их PIN-кодов (поддерживает переопределение через переменные окружения)
const SERVER_STAFF: readonly StaffMember[] = [
  {
    id: 'staff-waiter-1',
    name: 'Айбек Садыков',
    role: 'waiter',
    roleTitle: 'Официант зала',
    pinCode: process.env.STAFF_WAITER_PIN || '1111',
    avatarInitial: 'А',
  },
  {
    id: 'staff-kitchen-1',
    name: 'Бакыт Токтогулов',
    role: 'kitchen',
    roleTitle: 'Шеф-повар',
    pinCode: process.env.STAFF_KITCHEN_PIN || '2222',
    avatarInitial: 'Б',
  },
  {
    id: 'staff-manager-1',
    name: 'Нурлан Асанов',
    role: 'manager',
    roleTitle: 'Управляющий заведением',
    pinCode: process.env.STAFF_MANAGER_PIN || '9999',
    avatarInitial: 'Н',
  },
];

export function authenticateStaffByPinOnServer(pin: string): StaffMember | null {
  const clean = pin.trim();
  return SERVER_STAFF.find((m) => m.pinCode === clean) || null;
}

export interface SessionTokenPayload {
  readonly id: string;
  readonly name: string;
  readonly role: StaffRole;
  readonly expiresAt: number;
}

/**
 * Создает подписанный HMAC-SHA256 токен сессии сотрудника
 */
export function createStaffToken(member: StaffMember): string {
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 часов смены
  const payload: SessionTokenPayload = {
    id: member.id,
    name: member.name,
    role: member.role,
    expiresAt,
  };
  const json = JSON.stringify(payload);
  const base64Payload = Buffer.from(json, 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Верифицирует токен сессии сотрудника
 */
export function verifyStaffToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(base64Payload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf-8');
    const expBuf = Buffer.from(expectedSig, 'utf-8');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const json = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const payload = JSON.parse(json) as SessionTokenPayload;

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export interface AuthCheckResult {
  readonly authorized: boolean;
  readonly session?: SessionTokenPayload;
  readonly error?: string;
  readonly status: number;
}

/**
 * Проверка авторизации входящего HTTP-запроса к защищенным маршрутам API
 */
export function authorizeStaffRequest(
  req: NextRequest,
  requiredPermission?: keyof StaffPermissions
): AuthCheckResult {
  // 1. Попытка извлечь токен из cookie 'aura_staff_token'
  let token = req.cookies.get('aura_staff_token')?.value;

  // 2. Фолбэк: заголовок Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return {
      authorized: false,
      error: 'Требуется авторизация сотрудника (отсутствует токен доступа)',
      status: 401,
    };
  }

  const session = verifyStaffToken(token);
  if (!session) {
    return {
      authorized: false,
      error: 'Сессия недействительна или истекла, пожалуйста, введите PIN повторно',
      status: 401,
    };
  }

  // 3. Проверка прав доступа роли
  if (requiredPermission) {
    const permissions = getPermissionsByRole(session.role);
    if (!permissions[requiredPermission]) {
      return {
        authorized: false,
        error: `Недостаточно прав: роль ${session.role} не имеет разрешения ${String(requiredPermission)}`,
        status: 403,
      };
    }
  }

  return {
    authorized: true,
    session,
    status: 200,
  };
}
