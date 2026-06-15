import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@/generated/prisma/client';
import {
  AlertSeverity,
  RequestStatus,
  SurveyStatus,
  SystemRole,
} from '@/generated/prisma/enums';
import { PrismaPg } from '@prisma/adapter-pg';
import { ROLES } from '@/modules/rbac/constants/roles.const';
import { DEFAULT_CITY_DEPARTMENTS } from '@/shared/constants/departments.const';
import { ALERT_TYPES } from '@/shared/constants/alerts.const';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_CITY_NAME = 'Демо-Сіті (Аналітика)';
const DEMO_CITY_REGION = 'Київська область';
const DEMO_EMAIL_DOMAIN = 'demo.uce.local';
const DEMO_PASSWORD = 'demo1234';
const CITY_CENTER = { lat: 50.4501, lng: 30.5234 }; // Kyiv

const CITIZEN_COUNT = 35;
const REQUEST_COUNT = 160;
const SURVEY_COUNT = 6;
const ALERT_COUNT = 28;
const NEWS_COUNT = 20;
const WINDOW_DAYS = 180;

const MS_PER_DAY = 86_400_000;
const BCRYPT_ROUNDS = 10;
const MAX_PRIORITY = 3;
const MAX_RESOLVE_DAYS = 20;
const COORD_SPREAD_LAT = 0.004;
const COORD_SPREAD_LNG = 0.005;
const VOTE_PROBABILITY = 0.7;
const VOTE_DELAY_MAX_DAYS = 6;
const SURVEY_CLOSED_PROBABILITY = 0.4;
const SURVEY_CLOSE_AFTER_DAYS = 7;

// Request hotspots — give the heatmap visible clusters.
const HOTSPOTS = [
  { lat: 50.452, lng: 30.523 },
  { lat: 50.44, lng: 30.5 },
  { lat: 50.462, lng: 30.55 },
  { lat: 50.447, lng: 30.54 },
  { lat: 50.435, lng: 30.53 },
];

const NOW = Date.now();

const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randDateWithin = (days: number): Date =>
  new Date(NOW - Math.random() * days * MS_PER_DAY);

const gauss = (mean: number, std: number): number => {
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const weightedStatus = (): RequestStatus => {
  const r = Math.random();
  if (r < 0.25) return RequestStatus.OPEN;
  if (r < 0.45) return RequestStatus.IN_PROGRESS;
  if (r < 0.9) return RequestStatus.RESOLVED;
  return RequestStatus.REJECTED;
};

const REQUEST_TITLES = [
  'Яма на дорозі',
  'Не працює вуличне освітлення',
  'Прорив водопроводу',
  'Зламана лавка у парку',
  'Сміття не вивезено',
  'Несправний світлофор',
  'Дерево загрожує падінням',
  'Відсутнє опалення',
  'Пошкоджений тротуар',
  'Підтоплення підвалу',
];

async function cleanup() {
  console.log('Cleaning up previous demo data...');

  // City delete cascades to its requests, surveys, votes, alerts, news, roles,
  // departments and memberships.
  await prisma.city.deleteMany({ where: { name: DEMO_CITY_NAME } });
  await prisma.user.deleteMany({
    where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
  });
}

async function main() {
  await cleanup();

  console.log(`Creating demo city "${DEMO_CITY_NAME}"...`);
  const city = await prisma.city.create({
    data: {
      name: DEMO_CITY_NAME,
      region: DEMO_CITY_REGION,
      centerLat: CITY_CENTER.lat,
      centerLng: CITY_CENTER.lng,
    },
    select: { id: true },
  });
  const cityId = city.id;

  await prisma.role.createMany({
    data: Object.values(ROLES).map((name) => ({ cityId, name })),
    skipDuplicates: true,
  });
  const roles = await prisma.role.findMany({
    where: { cityId },
    select: { id: true, name: true },
  });
  const roleId = (name: string) =>
    roles.find((r) => r.name === name)?.id as string;

  await prisma.department.createMany({
    data: DEFAULT_CITY_DEPARTMENTS.map((d) => ({ cityId, ...d })),
    skipDuplicates: true,
  });
  const departments = await prisma.department.findMany({
    where: { cityId },
    select: { id: true },
  });
  const departmentIds = departments.map((d) => d.id);

  for (const name of Object.values(ALERT_TYPES)) {
    await prisma.alertType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const alertTypes = await prisma.alertType.findMany({
    select: { id: true },
  });
  const alertTypeIds = alertTypes.map((a) => a.id);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const userData = [
    {
      name: 'Муніципалітет Демо',
      email: `municipality@${DEMO_EMAIL_DOMAIN}`,
      passwordHash,
    },
    ...Array.from({ length: CITIZEN_COUNT }, (_, i) => ({
      name: `Мешканець ${i + 1}`,
      email: `citizen${i + 1}@${DEMO_EMAIL_DOMAIN}`,
      passwordHash,
      createdAt: randDateWithin(WINDOW_DAYS),
    })),
  ];
  await prisma.user.createMany({ data: userData, skipDuplicates: true });
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
    select: { id: true, email: true },
  });
  const muni = users.find((u) => u.email.startsWith('municipality'));
  const muniId = muni?.id as string;
  const citizenIds = users
    .filter((u) => u.email.startsWith('citizen'))
    .map((u) => u.id);

  // System admins join the demo city so they can open its analytics.
  const admins = await prisma.user.findMany({
    where: { systemRole: SystemRole.ADMIN },
    select: { id: true },
  });

  await prisma.userCity.createMany({
    data: [
      ...users.map((u) => ({ userId: u.id, cityId })),
      ...admins.map((a) => ({ userId: a.id, cityId })),
    ],
    skipDuplicates: true,
  });

  await prisma.userRole.createMany({
    data: [
      { userId: muniId, roleId: roleId(ROLES.MUNICIPALITY) },
      ...citizenIds.map((id) => ({
        userId: id,
        roleId: roleId(ROLES.CITIZEN),
      })),
    ],
    skipDuplicates: true,
  });
  console.log(`  OK ${users.length} demo users + memberships + roles`);

  const requests = Array.from({ length: REQUEST_COUNT }, () => {
    const status = weightedStatus();
    const createdAt = randDateWithin(WINDOW_DAYS);
    const hotspot = pick(HOTSPOTS);
    const isOpen = status === RequestStatus.OPEN;
    const resolvedAt =
      status === RequestStatus.RESOLVED
        ? new Date(
            Math.min(
              createdAt.getTime() + randInt(1, MAX_RESOLVE_DAYS) * MS_PER_DAY,
              NOW,
            ),
          )
        : null;

    return {
      cityId,
      userId: pick(citizenIds),
      title: pick(REQUEST_TITLES),
      description: 'Демонстраційне звернення для аналітики.',
      status,
      locationLat: gauss(hotspot.lat, COORD_SPREAD_LAT),
      locationLng: gauss(hotspot.lng, COORD_SPREAD_LNG),
      priority: randInt(0, MAX_PRIORITY),
      assignedDepartmentId: isOpen ? null : pick(departmentIds),
      resolvedAt,
      createdAt,
    };
  });
  await prisma.cityRequest.createMany({ data: requests });
  console.log(`  OK ${requests.length} city requests`);

  let totalVotes = 0;
  for (let s = 0; s < SURVEY_COUNT; s += 1) {
    const createdAt = randDateWithin(WINDOW_DAYS);
    const closed = Math.random() < SURVEY_CLOSED_PROBABILITY;
    const survey = await prisma.survey.create({
      data: {
        cityId,
        publisherId: muniId,
        title: `Опитування мешканців №${s + 1}`,
        description: 'Демонстраційне опитування.',
        status: closed ? SurveyStatus.CLOSED : SurveyStatus.OPEN,
        createdAt,
        closedAt: closed
          ? new Date(createdAt.getTime() + SURVEY_CLOSE_AFTER_DAYS * MS_PER_DAY)
          : null,
        options: {
          create: ['Варіант А', 'Варіант Б', 'Варіант В', 'Варіант Г'].map(
            (text, position) => ({ text, position }),
          ),
        },
      },
      select: { id: true, options: { select: { id: true } } },
    });

    const voters = citizenIds.filter(() => Math.random() < VOTE_PROBABILITY);
    const votes = voters.map((userId) => ({
      surveyId: survey.id,
      surveyOptionId: pick(survey.options).id,
      userId,
      createdAt: new Date(
        createdAt.getTime() + randInt(0, VOTE_DELAY_MAX_DAYS) * MS_PER_DAY,
      ),
    }));
    if (votes.length > 0) {
      await prisma.vote.createMany({ data: votes, skipDuplicates: true });
      totalVotes += votes.length;
    }
  }
  console.log(`  OK ${SURVEY_COUNT} surveys, ${totalVotes} votes`);

  const severities = Object.values(AlertSeverity);
  const alerts = Array.from({ length: ALERT_COUNT }, (_, i) => {
    const createdAt = randDateWithin(WINDOW_DAYS);
    return {
      cityId,
      publisherId: muniId,
      alertTypeId: pick(alertTypeIds),
      severity: pick(severities),
      title: `Оголошення №${i + 1}`,
      content: 'Демонстраційне оголошення для аналітики.',
      createdAt,
    };
  });
  await prisma.alert.createMany({ data: alerts });
  console.log(`  OK ${alerts.length} alerts`);

  const news = Array.from({ length: NEWS_COUNT }, (_, i) => ({
    cityId,
    publisherId: muniId,
    title: `Новина №${i + 1}`,
    content: 'Демонстраційна новина для аналітики.',
    createdAt: randDateWithin(WINDOW_DAYS),
  }));
  await prisma.generalNews.createMany({ data: news });
  console.log(`  OK ${news.length} news`);

  console.log('\nDemo seed complete.');
  console.log(`  City: ${DEMO_CITY_NAME} (id: ${cityId})`);
  console.log(
    `  Login: municipality@${DEMO_EMAIL_DOMAIN} / citizen1@${DEMO_EMAIL_DOMAIN}  (password: ${DEMO_PASSWORD})`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
