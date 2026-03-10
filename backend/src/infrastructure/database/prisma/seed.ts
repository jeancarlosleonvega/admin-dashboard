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

  // System Config
  { resource: 'system-config', action: 'view', description: 'Ver configuración del sistema' },
  { resource: 'system-config', action: 'manage', description: 'Gestionar configuración del sistema' },

  // Sport Types
  { resource: 'sport-types', action: 'view', description: 'Ver tipos de deporte' },
  { resource: 'sport-types', action: 'manage', description: 'Gestionar tipos de deporte' },

  // Venues
  { resource: 'venues', action: 'view', description: 'Ver espacios' },
  { resource: 'venues', action: 'manage', description: 'Gestionar espacios' },

  // Membership Plans
  { resource: 'membership-plans', action: 'view', description: 'Ver planes de membresía' },
  { resource: 'membership-plans', action: 'manage', description: 'Gestionar planes de membresía' },

  // User Memberships
  { resource: 'user-memberships', action: 'view', description: 'Ver membresías de socios' },
  { resource: 'user-memberships', action: 'manage', description: 'Gestionar membresías de socios' },

  // Blocked Periods
  { resource: 'blocked-periods', action: 'view', description: 'Ver períodos bloqueados' },
  { resource: 'blocked-periods', action: 'manage', description: 'Gestionar períodos bloqueados' },

  // Venue Schedules
  { resource: 'venue-schedules', action: 'view', description: 'Ver schedules de espacios' },
  { resource: 'venue-schedules', action: 'manage', description: 'Gestionar schedules de espacios' },

  // Slots
  { resource: 'slots', action: 'view', description: 'Ver disponibilidad de slots' },

  // Additional Services
  { resource: 'additional-services', action: 'view', description: 'Ver servicios adicionales' },
  { resource: 'additional-services', action: 'manage', description: 'Gestionar servicios adicionales' },

  // Bookings
  { resource: 'bookings', action: 'view', description: 'Ver reservas' },
  { resource: 'bookings', action: 'manage', description: 'Gestionar reservas' },

  // Payments
  { resource: 'payments', action: 'view', description: 'Ver pagos' },
  { resource: 'payments', action: 'manage', description: 'Gestionar pagos' },

  // QR
  { resource: 'qr', action: 'validate', description: 'Validar QR de acceso' },
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
      'sport-types.view',
      'sport-types.manage',
      'venues.view',
      'venues.manage',
      'membership-plans.view',
      'membership-plans.manage',
      'user-memberships.view',
      'user-memberships.manage',
      'blocked-periods.view',
      'blocked-periods.manage',
      'venue-schedules.view',
      'venue-schedules.manage',
      'slots.view',
      'additional-services.view',
      'additional-services.manage',
      'bookings.view',
      'bookings.manage',
      'payments.view',
      'payments.manage',
      'qr.validate',
    ],
  },
  {
    name: 'Recepcionista',
    description: 'Acceso de recepción',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'venues.view',
      'membership-plans.view',
      'slots.view',
      'bookings.view',
      'qr.validate',
      'additional-services.view',
    ],
  },
  {
    name: 'Cliente',
    description: 'Acceso básico de cliente',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'membership-plans.view',
      'slots.view',
      'additional-services.view',
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
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
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

  // Seed initial SportType: Golf
  const golfSportType = await prisma.sportType.upsert({
    where: { name: 'Golf' },
    update: {},
    create: {
      name: 'Golf',
      description: 'Campo de golf del club',
      defaultIntervalMinutes: 10,
      defaultPlayersPerSlot: 4,
      defaultOpenTime: '07:00',
      defaultCloseTime: '18:00',
      defaultEnabledDays: [1, 2, 3, 4, 5, 6, 7],
      active: true,
    },
  });
  console.log('SportType Golf creado');

  // Seed MembershipPlans
  await prisma.membershipPlan.upsert({
    where: { name: 'Membresía Golf' },
    update: {},
    create: {
      name: 'Membresía Golf',
      description: 'Acceso preferencial al campo de golf con tarifa fija por reserva',
      price: 0,
      monthlyReservationLimit: 8,
      sportTypeId: golfSportType.id,
      active: true,
    },
  });

  await prisma.membershipPlan.upsert({
    where: { name: 'Sin Membresía' },
    update: {},
    create: {
      name: 'Sin Membresía',
      description: 'Acceso sin suscripción, precio dinámico por reserva',
      price: 0,
      monthlyReservationLimit: null,
      sportTypeId: golfSportType.id,
      active: true,
    },
  });
  console.log('MembershipPlans creados');

  // Seed SystemConfig defaults
  const defaultConfigs = [
    { key: 'cancellations_enabled', value: 'true', label: 'Cancelaciones habilitadas', group: 'reservas' },
    { key: 'max_absences_before_suspension', value: '3', label: 'Máximo de ausencias antes de suspensión', group: 'ausencias' },
    { key: 'suspension_duration_days', value: '30', label: 'Duración de suspensión (días)', group: 'ausencias' },
    { key: 'transfer_payment_deadline_hours', value: '24', label: 'Horas límite para confirmar transferencia', group: 'pagos' },
    { key: 'golf_member_tee_time_price', value: '3000', label: 'Precio fijo tee time para socios Golf', group: 'precios' },
  ];
  for (const config of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('SystemConfig defaults creados');

  // Seed ConditionTypes
  const conditionTypes = [
    {
      name: 'Tipo de membresía',
      key: 'membership_plan',
      dataType: 'UUID' as const,
      allowedOperators: ['EQ', 'NEQ'],
      description: 'Filtra por plan de membresía del socio',
    },
    {
      name: 'Sexo',
      key: 'sex',
      dataType: 'ENUM' as const,
      allowedOperators: ['EQ', 'NEQ'],
      description: 'Filtra por sexo del socio (MALE / FEMALE)',
    },
    {
      name: 'Edad',
      key: 'age',
      dataType: 'NUMBER' as const,
      allowedOperators: ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE'],
      description: 'Filtra por edad del socio en años',
    },
    {
      name: 'Handicap',
      key: 'handicap',
      dataType: 'NUMBER' as const,
      allowedOperators: ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE'],
      description: 'Filtra por handicap del socio',
    },
  ];

  for (const ct of conditionTypes) {
    await prisma.conditionType.upsert({
      where: { key: ct.key },
      update: {},
      create: ct,
    });
  }
  console.log('ConditionTypes creados');

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
