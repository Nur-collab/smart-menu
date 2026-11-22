import { NextRequest } from 'next/server';
import { POST as authPinPOST } from '../src/app/api/auth/pin/route';
import { PATCH as menuPATCH, DELETE as menuDELETE } from '../src/app/api/menu/[id]/route';

async function main() {
  console.log('Testing Server-Side PIN Authentication & API Authorization Guard...');

  // 1. Попытка несанкционированного изменения цены блюда без токена
  const unauthReq = new NextRequest('http://localhost:3000/api/menu/item-9', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price: 100 }),
  });
  const unauthRes = await menuPATCH(unauthReq, { params: Promise.resolve({ id: 'item-9' }) });
  console.log('Unauthenticated PATCH /api/menu/[id] status:', unauthRes.status);
  if (unauthRes.status !== 401) {
    throw new Error(`SECURITY FAILED: Expected 401, got ${unauthRes.status}`);
  }

  // 2. Попытка аутентификации с неверным PIN
  const wrongPinReq = new NextRequest('http://localhost:3000/api/auth/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '0000' }),
  });
  const wrongPinRes = await authPinPOST(wrongPinReq);
  console.log('Wrong PIN /api/auth/pin status:', wrongPinRes.status);
  if (wrongPinRes.status !== 401) {
    throw new Error(`SECURITY FAILED: Expected 401 for wrong PIN, got ${wrongPinRes.status}`);
  }

  // 3. Успешная аутентификация с PIN управляющего 9999
  const validPinReq = new NextRequest('http://localhost:3000/api/auth/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '9999' }),
  });
  const validPinRes = await authPinPOST(validPinReq);
  const authData = await validPinRes.json();
  console.log('Valid PIN /api/auth/pin status:', validPinRes.status, 'Member:', authData.member?.name);
  if (validPinRes.status !== 200 || !authData.token) {
    throw new Error('SECURITY FAILED: Expected 200 and session token');
  }

  // 4. Авторизованный запрос с Bearer токеном
  const authReq = new NextRequest('http://localhost:3000/api/menu/item-9', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authData.token}`,
    },
    body: JSON.stringify({ price: 1850 }), // сохраняем ту же цену
  });
  const authRes = await menuPATCH(authReq, { params: Promise.resolve({ id: 'item-9' }) });
  console.log('Authenticated PATCH /api/menu/[id] status:', authRes.status);
  if (authRes.status !== 200) {
    throw new Error(`AUTHORIZED REQUEST FAILED: Expected 200, got ${authRes.status}`);
  }

  console.log('SUCCESS: All security authorization guards verified!');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
