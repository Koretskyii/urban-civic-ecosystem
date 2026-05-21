import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ROLES } from '../src/modules/rbac/constants/roles.const';

describe('CityRequests flow (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = `e2e-${Date.now()}`;
  let cityId = '';
  let departmentId = '';
  let citizenToken = '';
  let municipalityToken = '';
  let citizenUserId = '';
  let municipalityUserId = '';

  let requestId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const city = await prisma.city.create({
      data: {
        name: `Test City ${runId}`,
        region: 'Test Region',
      },
      select: { id: true },
    });
    cityId = city.id;

    await prisma.role.createMany({
      data: Object.values(ROLES).map((roleName) => ({
        cityId,
        name: roleName,
      })),
      skipDuplicates: true,
    });

    const department = await prisma.department.create({
      data: {
        cityId,
        name: `E2E Department ${runId}`,
        type: 'OTHER',
        description: 'E2E test department',
        isActive: true,
      },
      select: { id: true },
    });
    departmentId = department.id;

    const server = app.getHttpServer();

    const citizenRegister = await request(server)
      .post('/auth/register')
      .send({
        name: 'E2E Citizen',
        email: `citizen-${runId}@test.local`,
        password: 'Password123!',
      })
      .expect(201);

    citizenToken = citizenRegister.body.accessToken as string;
    citizenUserId = citizenRegister.body.user.id as string;

    const municipalityRegister = await request(server)
      .post('/auth/register')
      .send({
        name: 'E2E Municipality',
        email: `municipality-${runId}@test.local`,
        password: 'Password123!',
      })
      .expect(201);

    municipalityToken = municipalityRegister.body.accessToken as string;
    municipalityUserId = municipalityRegister.body.user.id as string;

    await prisma.userCity.createMany({
      data: [
        { cityId, userId: citizenUserId },
        { cityId, userId: municipalityUserId },
      ],
      skipDuplicates: true,
    });

    const roles = await prisma.role.findMany({
      where: {
        cityId,
        name: {
          in: [ROLES.CITIZEN, ROLES.MUNICIPALITY],
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const citizenRole = roles.find((role) => role.name === ROLES.CITIZEN);
    const municipalityRole = roles.find(
      (role) => role.name === ROLES.MUNICIPALITY,
    );

    if (!citizenRole || !municipalityRole) {
      throw new Error('Required test roles were not created');
    }

    await prisma.userRole.createMany({
      data: [
        { userId: citizenUserId, roleId: citizenRole.id },
        { userId: municipalityUserId, roleId: municipalityRole.id },
      ],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.city.deleteMany({
        where: {
          id: cityId,
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              `citizen-${runId}@test.local`,
              `municipality-${runId}@test.local`,
            ],
          },
        },
      });
    }

    if (app) {
      await app.close();
    }

    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('create -> assign -> report -> chat -> resolve', async () => {
    const server = app.getHttpServer();

    const createdRequest = await request(server)
      .post(`/city/${cityId}/requests`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Broken traffic light')
      .field('description', 'Traffic light is not working at central square')
      .field('locationLat', '50.4501')
      .field('locationLng', '30.5234')
      .expect(201);

    requestId = createdRequest.body.id as string;
    expect(requestId).toBeTruthy();

    const assignment = await request(server)
      .patch(`/city/${cityId}/requests/${requestId}/assign`)
      .set('Authorization', `Bearer ${municipalityToken}`)
      .send({ departmentId })
      .expect(200);

    expect(assignment.body.assignedDepartmentId).toBe(departmentId);
    expect(assignment.body.status).toBe('IN_PROGRESS');

    const progressReport = await request(server)
      .post(`/city/${cityId}/requests/${requestId}/reports`)
      .set('Authorization', `Bearer ${municipalityToken}`)
      .field('type', 'PROGRESS')
      .field('description', 'Crew has been dispatched.')
      .expect(201);

    expect(progressReport.body.type).toBe('PROGRESS');

    const message = await request(server)
      .post(`/city/${cityId}/requests/${requestId}/messages`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ content: 'Any ETA for resolution?' })
      .expect(201);

    expect(message.body.content).toBe('Any ETA for resolution?');

    const resolutionReport = await request(server)
      .post(`/city/${cityId}/requests/${requestId}/reports`)
      .set('Authorization', `Bearer ${municipalityToken}`)
      .field('type', 'RESOLUTION')
      .field('status', 'RESOLVED')
      .field('description', 'Traffic light fixed and tested.')
      .expect(201);

    expect(resolutionReport.body.type).toBe('RESOLUTION');
    expect(resolutionReport.body.status).toBe('RESOLVED');

    const messages = await request(server)
      .get(`/city/${cityId}/requests/${requestId}/messages`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .expect(200);

    expect(Array.isArray(messages.body)).toBe(true);
    expect(
      messages.body.some(
        (chatMessage: { content: string }) =>
          chatMessage.content === 'Any ETA for resolution?',
      ),
    ).toBe(true);

    const detail = await request(server)
      .get(`/city/${cityId}/requests/${requestId}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .expect(200);

    expect(detail.body.status).toBe('RESOLVED');
    expect(detail.body.resolvedAt).toBeTruthy();
    expect(Array.isArray(detail.body.reports)).toBe(true);
    expect(
      detail.body.reports.some(
        (report: { type: string }) => report.type === 'PROGRESS',
      ),
    ).toBe(true);
    expect(
      detail.body.reports.some(
        (report: { type: string }) => report.type === 'RESOLUTION',
      ),
    ).toBe(true);
  });
});
