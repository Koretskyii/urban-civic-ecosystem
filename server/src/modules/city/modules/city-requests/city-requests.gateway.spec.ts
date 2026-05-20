import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CityRequestsGateway } from './city-requests.gateway';
import { CityRequestsService } from './city-requests.service';
import {
  CITY_REQUESTS_MUTATION_EVENTS,
  CITY_REQUESTS_SOCKET_EVENTS,
} from './city-requests.events';

describe('CityRequestsGateway', () => {
  let gateway: CityRequestsGateway;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCityRequestsService = {
    assertRequestRoomAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityRequestsGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CityRequestsService,
          useValue: mockCityRequestsService,
        },
      ],
    }).compile();

    gateway = module.get<CityRequestsGateway>(CityRequestsGateway);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('handleConnection should authenticate socket user', async () => {
    mockConfigService.get.mockReturnValue('secret');
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
    });

    const client = {
      handshake: {
        auth: { token: 'Bearer jwt-token' },
        headers: {},
      },
      data: {},
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('jwt-token', {
      secret: 'secret',
    });
    expect(client.data.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
    });
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('handleConnection should authenticate with token from cookie', async () => {
    mockConfigService.get.mockReturnValue('secret');
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-2',
      email: 'cookie@example.com',
    });

    const client = {
      handshake: {
        auth: {},
        headers: {
          cookie: 'foo=bar; access_token=jwt-cookie-token',
        },
      },
      data: {},
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('jwt-cookie-token', {
      secret: 'secret',
    });
    expect(client.data.user).toEqual({
      id: 'user-2',
      email: 'cookie@example.com',
    });
  });

  it('handleConnection should decode cookie token value', async () => {
    mockConfigService.get.mockReturnValue('secret');
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-3',
      email: 'encoded@example.com',
    });

    const client = {
      handshake: {
        auth: {},
        headers: {
          cookie: 'access_token=Bearer%20jwt-encoded-token',
        },
      },
      data: {},
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('jwt-encoded-token', {
      secret: 'secret',
    });
  });

  it('handleConnection should disconnect unauthenticated socket', async () => {
    const client = {
      handshake: {
        auth: {},
        headers: {},
      },
      data: {},
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('handleJoinRoom should join room after access check', async () => {
    mockCityRequestsService.assertRequestRoomAccess.mockResolvedValue({
      requestId: 'request-1',
      cityId: 'city-1',
    });

    const client = {
      data: { user: { id: 'user-1' } },
      join: jest.fn(),
    } as any;

    const result = await gateway.handleJoinRoom(client, {
      requestId: 'request-1',
    });

    expect(mockCityRequestsService.assertRequestRoomAccess).toHaveBeenCalledWith(
      'request-1',
      'user-1',
    );
    expect(client.join).toHaveBeenCalledWith('city-request:request-1');
    expect(result).toEqual({
      event: CITY_REQUESTS_SOCKET_EVENTS.ROOM_JOINED,
      data: {
        room: 'city-request:request-1',
      },
    });
  });

  it('handleJoinRoom should throw if requestId is missing', async () => {
    const client = {
      data: { user: { id: 'user-1' } },
      join: jest.fn(),
    } as any;

    await expect(gateway.handleJoinRoom(client, {} as any)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('emitMutationEvent should emit to request room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as any;

    gateway.emitMutationEvent(
      'request-1',
      CITY_REQUESTS_MUTATION_EVENTS.MESSAGE_CREATED,
      { hello: 'world' },
    );

    expect(to).toHaveBeenCalledWith('city-request:request-1');
    expect(emit).toHaveBeenCalledWith(
      CITY_REQUESTS_SOCKET_EVENTS.MESSAGE_CREATED,
      { hello: 'world' },
    );
  });
});
