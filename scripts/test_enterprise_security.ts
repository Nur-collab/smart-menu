import { NextRequest } from 'next/server';
import { POST as authPinPOST } from '../src/app/api/auth/pin/route';
import { GET as healthGET } from '../src/app/api/health/route';
import { createStaffToken, verifyStaffToken } from '../src/lib/serverAuth';

async function main() {
  console.log('Testing Enterprise Security & Architecture Standards...');

  // 1. Тест эндпоинта здоровья системы /api/health
  const healthRes = await healthGET();
  const healthData = await healthRes.json();
  console.log('Health check status:', healthRes.status, 'DB status:', healthData.checks?.database?.status, 'Latency:', healthData.checks?.database?.latencyMs, 'ms');
  if (healthRes.status !== 200 || healthData.checks?.database?.status !== 'healthy') {
    throw new Error('HEALTH CHECK FAILED: Neon DB is not reporting healthy');
  }

  // 2. Тест криптографии HMAC и защиты от подделки токенов (Timing-Safe)
  const token = createStaffToken({
    id: 'staff-manager-1',
    name: 'Нурлан Асанов',
    role: 'manager',
    roleTitle: 'Управляющий',
    pinCode: '9999',
    avatarInitial: 'Н',
  });
  const validSession = verifyStaffToken(token);
  console.log('Valid token verification:', validSession?.name, 'Role:', validSession?.role);
  if (!validSession || validSession.role !== 'manager') {
    throw new Error('TOKEN VERIFICATION FAILED: Valid token not accepted');
  }

  // Попытка подделки токена (изменение одного символа в подписи)
  const tamperedToken = token.slice(0, -3) + 'XYZ';
  const invalidSession = verifyStaffToken(tamperedToken);
  console.log('Tampered token verification result (should be null):', invalidSession);
  if (invalidSession !== null) {
    throw new Error('SECURITY BREACH: Tampered token was accepted!');
  }

  // 3. Тест защиты от брутфорса (Rate Limiting) на /api/auth/pin
  // Делаем 5 попыток с неверным PIN от одного IP
  console.log('Testing Brute-force rate limiter (5 attempts allowed, 6th blocked)...');
  const mockHeaders = {
    'Content-Type': 'application/json',
    'x-forwarded-for': '198.51.100.42', // тестовый IP
  };

  for (let i = 1; i <= 5; i++) {
    const req = new NextRequest('http://localhost:3000/api/auth/pin', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({ pin: `000${i}` }),
    });
    const res = await authPinPOST(req);
    if (res.status !== 401) {
      throw new Error(`Attempt ${i}: Expected 401, got ${res.status}`);
    }
  }

  // 6-я попытка должна быть заблокирована с кодом 429 Too Many Requests
  const blockedReq = new NextRequest('http://localhost:3000/api/auth/pin', {
    method: 'POST',
    headers: mockHeaders,
    body: JSON.stringify({ pin: '9999' }),
  });
  const blockedRes = await authPinPOST(blockedReq);
  const blockedData = await blockedRes.json();
  console.log('6th attempt status (should be 429):', blockedRes.status, 'Error:', blockedData.error);
  if (blockedRes.status !== 429) {
    throw new Error(`RATE LIMITER FAILED: Expected 429, got ${blockedRes.status}`);
  }

  console.log('SUCCESS: All enterprise security standards verified!');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
