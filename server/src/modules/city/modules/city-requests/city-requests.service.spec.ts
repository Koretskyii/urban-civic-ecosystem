import { Test, TestingModule } from '@nestjs/testing';
import { CityRequestsService } from './city-requests.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { R2StorageService } from '@/modules/r2/r2.service';
import { ReportType, RequestStatus } from '@/generated/prisma/enums';

describe('CityRequestsService', () => {
  let service: CityRequestsService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    userCity: {
      findUnique: jest.fn(),
    },
    cityRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
    },
  };

  const mockRbacService = {
    hasPermission: jest.fn(),
  };

  const mockR2StorageService = {
    uploadCityRequestAttachment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityRequestsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RbacService,
          useValue: mockRbacService,
        },
        {
          provide: R2StorageService,
          useValue: mockR2StorageService,
        },
      ],
    }).compile();

    service = module.get<CityRequestsService>(CityRequestsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createRequest should create request, chat and request attachments', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'user-1',
      cityId: 'city-1',
    });

    const txMock = {
      cityRequest: {
        create: jest.fn().mockResolvedValue({ id: 'request-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'request-1' }),
      },
      chat: {
        create: jest.fn().mockResolvedValue({ id: 'chat-1' }),
      },
      attachment: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockPrismaService.$transaction.mockImplementation(
      async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock),
    );

    mockR2StorageService.uploadCityRequestAttachment.mockResolvedValue({
      key: 'key-1',
      url: 'https://cdn.local/file-1.jpg',
    });

    const files = [
      {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('file'),
      },
    ] as Express.Multer.File[];

    await service.createRequest(
      'city-1',
      'user-1',
      {
        title: 'Broken streetlight',
        locationLat: 50.45,
        locationLng: 30.52,
      },
      files,
    );

    const createRequestCalls = txMock.cityRequest.create.mock
      .calls as unknown[][];
    const createRequestCall = createRequestCalls[0]?.[0] as {
      data: { cityId: string; userId: string; title: string };
    };
    expect(createRequestCall.data.cityId).toBe('city-1');
    expect(createRequestCall.data.userId).toBe('user-1');
    expect(createRequestCall.data.title).toBe('Broken streetlight');

    const createChatCalls = txMock.chat.create.mock.calls as unknown[][];
    const createChatCall = createChatCalls[0]?.[0] as {
      data: { cityRequestId: string; contextType: string };
    };
    expect(createChatCall.data.cityRequestId).toBe('request-1');
    expect(createChatCall.data.contextType).toBe('cityRequest');
    expect(txMock.attachment.createMany).toHaveBeenCalled();
  });

  it('assignDepartment should update OPEN request to IN_PROGRESS', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'manager-1',
      cityId: 'city-1',
    });
    mockRbacService.hasPermission.mockResolvedValue(true);
    mockPrismaService.cityRequest.findFirst.mockResolvedValue({
      id: 'request-1',
      cityId: 'city-1',
      status: RequestStatus.OPEN,
    });
    mockPrismaService.department.findFirst.mockResolvedValue({
      id: 'dep-1',
      cityId: 'city-1',
      isActive: true,
    });
    mockPrismaService.cityRequest.update.mockResolvedValue({ id: 'request-1' });

    await service.assignDepartment('city-1', 'request-1', 'manager-1', {
      departmentId: 'dep-1',
    });

    const assignCalls = mockPrismaService.cityRequest.update.mock
      .calls as unknown[][];
    const assignCall = assignCalls[0]?.[0] as {
      data: { assignedDepartmentId: string; status: RequestStatus };
    };
    expect(assignCall.data.assignedDepartmentId).toBe('dep-1');
    expect(assignCall.data.status).toBe(RequestStatus.IN_PROGRESS);
  });

  it('createReport should persist resolution report, upload attachment and update request status', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'manager-1',
      cityId: 'city-1',
    });
    mockRbacService.hasPermission.mockResolvedValue(true);
    mockPrismaService.cityRequest.findFirst.mockResolvedValue({
      id: 'request-1',
      cityId: 'city-1',
      status: RequestStatus.IN_PROGRESS,
    });

    const txMock = {
      report: {
        create: jest.fn().mockResolvedValue({ id: 'report-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'report-1' }),
      },
      attachment: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      cityRequest: {
        update: jest.fn().mockResolvedValue({ id: 'request-1' }),
      },
    };

    mockPrismaService.$transaction.mockImplementation(
      async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock),
    );

    mockR2StorageService.uploadCityRequestAttachment.mockResolvedValue({
      key: 'key-2',
      url: 'https://cdn.local/resolution.jpg',
    });

    const files = [
      {
        originalname: 'resolution.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('img'),
      },
    ] as Express.Multer.File[];

    await service.createReport(
      'city-1',
      'request-1',
      'manager-1',
      {
        type: ReportType.RESOLUTION,
        status: RequestStatus.RESOLVED,
        description: 'Issue fully resolved.',
      },
      files,
    );

    const createReportCalls = txMock.report.create.mock.calls as unknown[][];
    const createReportCall = createReportCalls[0]?.[0] as {
      data: { type: ReportType; status: RequestStatus; authorId: string };
    };
    expect(createReportCall.data.type).toBe(ReportType.RESOLUTION);
    expect(createReportCall.data.status).toBe(RequestStatus.RESOLVED);
    expect(createReportCall.data.authorId).toBe('manager-1');

    const updateRequestCalls = txMock.cityRequest.update.mock
      .calls as unknown[][];
    const updateRequestCall = updateRequestCalls[0]?.[0] as {
      data: { status: RequestStatus; resolvedAt: Date | null };
    };
    expect(updateRequestCall.data.status).toBe(RequestStatus.RESOLVED);
    expect(updateRequestCall.data.resolvedAt).toBeInstanceOf(Date);
  });

  it('getRequestDetail should allow city members to view another citizen request', async () => {
    const requestDetail = {
      id: 'request-1',
      cityId: 'city-1',
      userId: 'owner-1',
      user: { id: 'owner-1', name: 'Owner' },
      attachments: [],
      assignedDepartment: null,
      reports: [],
      chat: { messages: [] },
    };

    mockPrismaService.cityRequest.findFirst.mockResolvedValue({
      ...requestDetail,
    });

    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'citizen-2',
      cityId: 'city-1',
    });

    await expect(
      service.getRequestDetail('city-1', 'request-1', 'citizen-2'),
    ).resolves.toEqual(requestDetail);
    expect(mockRbacService.hasPermission).not.toHaveBeenCalled();
  });
});
