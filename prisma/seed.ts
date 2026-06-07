import { PrismaClient, UserRole, AccountType, BusinessType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'متجر تجريبي',
      slug: 'demo',
      businessType: BusinessType.GENERAL,
      currency: 'EGP',
      taxRate: 14,
      branches: {
        create: { name: 'الفرع الرئيسي', isMain: true },
      },
      accounts: {
        create: [
          { name: 'الخزنة الرئيسية', type: AccountType.CASH, balance: 0 },
          { name: 'البنك الأهلي', type: AccountType.BANK, balance: 0 },
        ],
      },
      categories: {
        create: [{ name: 'عام' }, { name: 'أصناف غذائية' }, { name: 'مشروبات' }],
      },
    },
    include: { branches: true },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      fullName: 'المالك',
      role: UserRole.OWNER,
      branchId: tenant.branches[0]?.id,
    },
  });

  console.log('✅ Seed complete.');
  console.log('   Tenant slug : demo');
  console.log('   Email       : admin@demo.com');
  console.log('   Password    : admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
