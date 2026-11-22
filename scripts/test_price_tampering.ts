import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/orders/route';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Testing Server-Side Price Tampering Prevention...');

  // 1. Попытка взлома: отправляем заказ со стейком Рибай (в базе стоит 1850 сом),
  // но злоумышленник подменил цену на 1 сом в cartItem.unitPrice и finalAmount: 1 сом
  const tamperedOrder = {
    id: `ord-tamper-test-${Date.now()}`,
    tableNumber: 4,
    items: [
      {
        cartItemId: 'fake-cart-1',
        menuItem: {
          id: 'item-9', // Стейк Рибай Black Angus
          name: 'Стейк Рибай Black Angus',
          price: 1, // Поддельная цена
        },
        quantity: 2,
        unitPrice: 1, // Поддельная цена за единицу
        selectedOptions: [],
      },
    ],
    totalAmount: 2, // Поддельный subtotal (1 * 2)
    discountAmount: 0,
    tipAmount: 0,
    finalAmount: 2, // Поддельный итоговый чек: 2 сома вместо 3700 сом!
    paymentMethod: 'elqr',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const req = new NextRequest('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tamperedOrder),
  });

  const res = await POST(req);
  const data = await res.json();

  console.log('Server response status:', res.status);
  console.log('Server calculated totalAmount:', data.data?.totalAmount);
  console.log('Server calculated finalAmount:', data.data?.finalAmount);

  // Ожидаем: 2 стейка по 1850 сом = 3700 сом!
  if (data.data?.finalAmount !== 3700) {
    throw new Error(`TEST FAILED: Server accepted tampered price! Expected 3700, got ${data.data?.finalAmount}`);
  }

  console.log('SUCCESS: Price tampering attempt was thwarted! Server recalculated real price 3700 сом from Neon DB.');

  // Очистка тестового заказа
  await prisma.order.delete({
    where: { id: tamperedOrder.id },
  });
  console.log('Test order cleaned up.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
