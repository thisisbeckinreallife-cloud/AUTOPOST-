import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const target = process.argv[2] || 'admin@example.com';
const updated = await db.adminUser.update({
  where: { email: target },
  data: {
    plan: 'SCALE',
    // Reset jamás (año 9999)
    aiCreditsResetAt: new Date('9999-12-31T00:00:00Z'),
    // Plan jamás expira
    planExpiresAt: new Date('9999-12-31T00:00:00Z'),
    // 999 millones — efectivamente infinito (cubre incluso 1000 reels/día durante años)
    aiCreditsMonthly: 999_999_999,
    aiCreditsAddon: 999_999_999,
  },
  select: {
    email: true, plan: true,
    aiCreditsMonthly: true, aiCreditsAddon: true,
    aiCreditsResetAt: true, planExpiresAt: true,
  },
});

console.log('✓ Créditos infinitos activados para:', updated.email);
console.log('  Plan:', updated.plan);
console.log('  Mensual:', updated.aiCreditsMonthly.toLocaleString());
console.log('  Add-on: ', updated.aiCreditsAddon.toLocaleString());
console.log('  Reset:  ', updated.aiCreditsResetAt?.toISOString().slice(0, 10));
console.log('  Plan expira:', updated.planExpiresAt?.toISOString().slice(0, 10));

await db.$disconnect();
