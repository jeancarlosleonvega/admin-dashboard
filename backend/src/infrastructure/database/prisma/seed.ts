import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const permissions = [
  // Dashboard
  { resource: 'dashboard', action: 'view', description: 'View dashboard' },

  // Users
  { resource: 'users', action: 'view', description: 'View users list' },
  { resource: 'users', action: 'create', description: 'Create new users' },
  { resource: 'users', action: 'edit', description: 'Edit users' },
  { resource: 'users', action: 'delete', description: 'Delete users' },

  // Roles
  { resource: 'roles', action: 'view', description: 'View roles list' },
  { resource: 'roles', action: 'manage', description: 'Create, edit, delete roles' },
];

const roles = [
  {
    name: 'Super Admin',
    description: 'Full system access',
    isSystem: true,
    permissions: permissions.map((p) => `${p.resource}.${p.action}`),
  },
  {
    name: 'Admin',
    description: 'Administrative access',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'users.view',
      'users.create',
      'users.edit',
      'roles.view',
    ],
  },
  {
    name: 'User',
    description: 'Basic user access',
    isSystem: true,
    permissions: ['dashboard.view'],
  },
];

async function main() {
  console.log('Seeding database...');

  // Create permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions created');

  // Create roles with permissions
  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    // Assign permissions to role
    for (const permCode of role.permissions) {
      const [resource, action] = permCode.split('.');
      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: createdRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: createdRole.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }
  console.log('Roles created');

  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  const adminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      status: 'ACTIVE',
    },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log('Admin user created: admin@example.com / admin123');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
