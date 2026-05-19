import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ROLES } from '@/modules/rbac/constants/roles.const';
import {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
} from '@/modules/rbac/constants/rolePermissions.const';
import { ALERT_TYPES } from '@/shared/constants/alerts.const';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLE_NAMES = Object.values(ROLES);
const ALERT_TYPE_NAMES = Object.values(ALERT_TYPES);

function validateRbacConfig() {
  const configuredRoles = Object.keys(ROLE_PERMISSIONS);
  const knownRoles = new Set<string>(ROLE_NAMES);
  const unknownRoles = configuredRoles.filter(
    (roleName) => !knownRoles.has(roleName),
  );

  if (unknownRoles.length > 0) {
    throw new Error(
      `ROLE_PERMISSIONS contains unknown roles: ${unknownRoles.join(', ')}`,
    );
  }

  const knownPermissions = new Set<string>(ALL_PERMISSIONS);
  const unknownPermissions = Object.entries(ROLE_PERMISSIONS).flatMap(
    ([roleName, permissions]) =>
      permissions
        .filter((permission) => !knownPermissions.has(permission))
        .map((permission) => `${roleName}:${permission}`),
  );

  if (unknownPermissions.length > 0) {
    throw new Error(
      `ROLE_PERMISSIONS contains unknown permissions: ${unknownPermissions.join(', ')}`,
    );
  }
}

async function seedPermissions() {
  console.log('Seeding permissions...');

  await prisma.permission.createMany({
    data: ALL_PERMISSIONS.map((key) => ({ key })),
    skipDuplicates: true,
  });

  const removedPermissions = await prisma.permission.deleteMany({
    where: {
      key: {
        notIn: ALL_PERMISSIONS,
      },
    },
  });

  console.log(
    `OK ${ALL_PERMISSIONS.length} permissions synced (${removedPermissions.count} stale removed).`,
  );
}

async function seedRolePermissions() {
  console.log('Seeding global role permissions...');

  const permissions = await prisma.permission.findMany({
    where: {
      key: {
        in: ALL_PERMISSIONS,
      },
    },
    select: {
      id: true,
      key: true,
    },
  });
  const permissionIdByKey = new Map(
    permissions.map((permission) => [permission.key, permission.id]),
  );

  const rolePermissionData = Object.entries(ROLE_PERMISSIONS).flatMap(
    ([roleName, permissionKeys]) =>
      Array.from(new Set(permissionKeys)).map((key) => {
        const permissionId = permissionIdByKey.get(key);

        if (!permissionId) {
          throw new Error(`Permission "${key}" was not seeded.`);
        }

        return {
          roleName,
          permissionId,
        };
      }),
  );

  await prisma.rolePermission.deleteMany({
    where: {
      roleName: {
        in: ROLE_NAMES,
      },
      NOT: {
        OR: rolePermissionData.map(({ roleName, permissionId }) => ({
          roleName,
          permissionId,
        })),
      },
    },
  });

  await prisma.rolePermission.createMany({
    data: rolePermissionData,
    skipDuplicates: true,
  });

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    console.log(
      `  OK "${roleName}" - ${new Set(permissionKeys).size} permissions`,
    );
  }

  console.log(`OK ${rolePermissionData.length} role-permission pairs synced.`);
}

async function seedRolesForAllCities() {
  const cities = await prisma.city.findMany({
    select: { id: true, name: true },
  });

  if (cities.length === 0) {
    console.log('No cities found - skipping city role seeding.');
    return;
  }

  console.log(`Seeding roles for ${cities.length} cities...`);

  for (const city of cities) {
    await prisma.role.createMany({
      data: ROLE_NAMES.map((roleName) => ({
        cityId: city.id,
        name: roleName,
      })),
      skipDuplicates: true,
    });

    const removedRoles = await prisma.role.deleteMany({
      where: {
        cityId: city.id,
        name: {
          notIn: ROLE_NAMES,
        },
      },
    });

    console.log(
      `  OK [${city.name}] ${ROLE_NAMES.length} roles synced (${removedRoles.count} stale removed)`,
    );
  }
}

async function seedDefaultAlertTypes() {
  console.log('Seeding default alert types...');

  for (const name of ALERT_TYPE_NAMES) {
    const existingAlertTypes = await prisma.alertType.findMany({
      where: { name },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const alertType =
      existingAlertTypes[0] ??
      (await prisma.alertType.create({
        data: { name },
        select: { id: true },
      }));
    const duplicateAlertTypeIds = existingAlertTypes
      .slice(1)
      .map(({ id }) => id);

    if (duplicateAlertTypeIds.length > 0) {
      await prisma.alert.updateMany({
        where: {
          alertTypeId: {
            in: duplicateAlertTypeIds,
          },
        },
        data: {
          alertTypeId: alertType.id,
        },
      });

      const duplicateSubscriptions = await prisma.alertSubscription.findMany({
        where: {
          alertTypeId: {
            in: duplicateAlertTypeIds,
          },
        },
        select: {
          userId: true,
          cityId: true,
        },
      });

      for (const subscription of duplicateSubscriptions) {
        await prisma.alertSubscription.upsert({
          where: {
            userId_cityId_alertTypeId: {
              userId: subscription.userId,
              cityId: subscription.cityId,
              alertTypeId: alertType.id,
            },
          },
          update: {},
          create: {
            userId: subscription.userId,
            cityId: subscription.cityId,
            alertTypeId: alertType.id,
          },
        });
      }

      await prisma.alertSubscription.deleteMany({
        where: {
          alertTypeId: {
            in: duplicateAlertTypeIds,
          },
        },
      });

      await prisma.alertType.deleteMany({
        where: {
          id: {
            in: duplicateAlertTypeIds,
          },
        },
      });
    }
  }

  console.log(`OK ${ALERT_TYPE_NAMES.length} default alert types synced.`);
}

async function main() {
  validateRbacConfig();
  await seedPermissions();
  await seedRolePermissions();
  await seedRolesForAllCities();
  await seedDefaultAlertTypes();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
