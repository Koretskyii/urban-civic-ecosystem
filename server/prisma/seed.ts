import 'dotenv/config';
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROLES } from "@/modules/rbac/constants/roles.const";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from "@/modules/rbac/constants/rolePermissions.const";
import { ALERT_TYPES } from '@/shared/constants/alerts.const';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedPermissions() {
    console.log('Seeding permissions...');
    for (const key of ALL_PERMISSIONS) {
        await prisma.permission.upsert({
            where: { key },
            update: {},
            create: { key },
        });
    }
    console.log(`✓ ${ALL_PERMISSIONS.length} permissions seeded.`);
}

async function seedRolePermissions() {
    console.log('Seeding global role permissions...');
    let count = 0;

    for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
        for (const key of permissionKeys) {
            const permission = await prisma.permission.findUnique({ where: { key } });
            if (!permission) continue;

            await prisma.rolePermission.upsert({
                where: { roleName_permissionId: { roleName, permissionId: permission.id } },
                update: {},
                create: { roleName, permissionId: permission.id },
            });
            count++;
        }
        console.log(`  ✓ "${roleName}" — ${permissionKeys.length} permissions`);
    }

    console.log(`✓ ${count} role-permission pairs seeded.`);
}

async function seedRolesForAllCities() {
    const cities = await prisma.city.findMany({ select: { id: true, name: true } });

    if (cities.length === 0) {
        console.log('No cities found — skipping role seeding.');
        return;
    }

    console.log(`Seeding roles for ${cities.length} cities...`);

    for (const city of cities) {
        for (const roleName of Object.values(ROLES)) {
            await prisma.role.upsert({
                where: { cityId_name: { cityId: city.id, name: roleName } },
                update: {},
                create: { cityId: city.id, name: roleName },
            });
        }
        console.log(`  ✓ [${city.name}] 4 roles upserted`);
    }
}

async function seedDefaultAlertTypes() {
    console.log('Seeding default alert types...');

    const defaultAlertTypes = Object.values(ALERT_TYPES).map((alertType) => ({ name: alertType }));
    await prisma.alertType.createMany({
        data: defaultAlertTypes,
        skipDuplicates: true,
    })

    console.log(`✓ ${Object.keys(ALERT_TYPES).length} default alert types seeded.`);
}

async function main() {
    await seedPermissions();
    await seedRolePermissions();
    await seedRolesForAllCities();
    await seedDefaultAlertTypes();
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());