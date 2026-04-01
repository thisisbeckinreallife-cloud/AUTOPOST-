/**
 * Seed script — creates demo admin user and businesses.
 * Run: npm run db:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const passwordHash = await hash("admin1234", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
    },
  });
  console.log(`✓ Admin user: ${admin.email} (password: admin1234)`);

  // Demo businesses
  const businesses = [
    {
      name: "Demo Brand",
      slug: "demo-brand",
      timezone: "Europe/Madrid",
      description: "Demo brand for testing",
    },
    {
      name: "Test Company",
      slug: "test-company",
      timezone: "America/New_York",
      description: "Secondary demo business",
    },
  ];

  for (const biz of businesses) {
    const b = await prisma.business.upsert({
      where: { slug: biz.slug },
      update: {},
      create: biz,
    });
    console.log(`✓ Business: ${b.name} (/${b.slug})`);
  }

  // Audit log for seed
  await prisma.auditLog.create({
    data: {
      action: "SEED_EXECUTED",
      detail: { seededAt: new Date().toISOString() },
    },
  });

  console.log("\n✅ Seed complete!");
  console.log("   Login: admin@example.com / admin1234");
  console.log("   Visit: http://localhost:3000\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
