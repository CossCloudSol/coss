/**
 * One-shot script: insert a SUPER_ADMIN AdminUser into the DB.
 * Run with: node --env-file=.env.local scripts/create-super-admin.js <password>
 *
 * Uses the same crypto.scrypt hashing as src/lib/auth.ts so the user can log in.
 */
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const ALL_PERMISSIONS = [
  'dashboard:view',
  'leads:view',
  'leads:edit',
  'leads:delete',
  'corporate:view',
  'corporate:edit',
  'corporate:delete',
  'analytics:view',
  'seo:view',
  'seo:edit',
  'topbar:view',
  'topbar:edit',
  'whatsapp:view',
  'settings:view',
  'settings:edit',
];

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: node --env-file=.env.local scripts/create-super-admin.js <password>');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.adminUser.findUnique({
      where: { email: 'cossdsnrcoss@gmail.com' },
    });

    if (existing) {
      console.log('User already exists:', existing.id, existing.email, existing.role, 'isActive:', existing.isActive);
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.adminUser.create({
      data: {
        name: 'COSS Super Admin',
        email: 'cossdsnrcoss@gmail.com',
        passwordHash,
        role: 'SUPER_ADMIN',
        permissions: ALL_PERMISSIONS,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('SUCCESS — AdminUser created:');
    console.log('  id:       ', user.id);
    console.log('  email:    ', user.email);
    console.log('  role:     ', user.role);
    console.log('  isActive: ', user.isActive);
    console.log('  permissions:', user.permissions.length, 'granted');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
