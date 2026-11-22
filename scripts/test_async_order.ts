import { createOrder, getAllOrders } from '../src/lib/serverStore';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Testing async createOrder with Neon DB persistence...');
  const testId = `ord-test-async-${Date.now()}`;
  const now = new Date().toISOString();
  const order = await createOrder({
    id: testId,
    tableNumber: 4,
    items: [],
    totalAmount: 500,
    discountAmount: 0,
    tipAmount: 50,
    finalAmount: 550,
    paymentMethod: 'elqr',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  console.log('Order created in store:', order.id);

  const dbOrder = await prisma.order.findUnique({
    where: { id: testId },
  });

  if (!dbOrder) {
    throw new Error('FAILED: Order was not found in Neon DB!');
  }

  console.log('SUCCESS: Order retrieved from Neon DB:', dbOrder.id, 'Final amount:', dbOrder.finalAmount);

  // Clean up
  await prisma.order.delete({
    where: { id: testId },
  });
  console.log('Test order cleaned up successfully.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
