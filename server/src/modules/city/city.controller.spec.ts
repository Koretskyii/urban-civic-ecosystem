import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { DomainVerificationService } from './domain-verification/domain-verification.service';
import { CityCreationService } from './city-creation/city-creation.service';

describe('CityController', () => {
  let controller: CityController;

  const mockCityService = {
    joinCity: jest.fn(),
  };
  const mockDomainVerificationService = {
    generateDomainToken: jest.fn(),
    verifyDomain: jest.fn(),
  };
  const mockCityCreationService = {
    getCurrentCityCreationRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityController],
      providers: [
        {
          provide: CityService,
          useValue: mockCityService,
        },
        {
          provide: DomainVerificationService,
          useValue: mockDomainVerificationService,
        },
        {
          provide: CityCreationService,
          useValue: mockCityCreationService,
        },
      ],
    }).compile();

    controller = module.get<CityController>(CityController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateDomainToken', () => {
    it('should throw UnauthorizedException if request user is missing', () => {
      const req = { user: undefined } as unknown as Request;
      expect(() => controller.generateDomainToken('test.com', req)).toThrow(
        UnauthorizedException,
      );
    });

    it('should call service.generateDomainToken with user id and domain', async () => {
      const domain = 'test.com';
      const expectedResult = { token: 'test-token', domain };
      mockDomainVerificationService.generateDomainToken.mockResolvedValue(
        expectedResult,
      );
      const req = { user: { id: 'user-id' } } as unknown as Request;

      const result = await controller.generateDomainToken(domain, req);

      expect(
        mockDomainVerificationService.generateDomainToken,
      ).toHaveBeenCalledWith('user-id', domain);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyDomain', () => {
    it('should throw UnauthorizedException if request user is missing', async () => {
      const req = { user: undefined } as unknown as Request;
      await expect(
        controller.verifyDomain({ domain: 'test.com', token: 'token' }, req),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call service.verifyDomain with user id, domain and token', async () => {
      const body = { domain: 'test.com', token: 'test-token' };
      const expectedResult = {
        success: true,
        message: 'Verified',
        domain: body.domain,
      };
      mockDomainVerificationService.verifyDomain.mockResolvedValue(
        expectedResult,
      );
      const req = { user: { id: 'user-id' } } as unknown as Request;

      const result = await controller.verifyDomain(body, req);

      expect(mockDomainVerificationService.verifyDomain).toHaveBeenCalledWith(
        'user-id',
        body.domain,
        body.token,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getCurrentCityCreationRequest', () => {
    it('should throw UnauthorizedException if request user is missing', async () => {
      const req = { user: undefined } as unknown as Request;
      await expect(
        controller.getCurrentCityCreationRequest(req),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call service.getCurrentCityCreationRequest with user id', async () => {
      const expectedResult = { id: 'request-1', name: 'Kyiv' };
      mockCityCreationService.getCurrentCityCreationRequest.mockResolvedValue(
        expectedResult,
      );
      const req = { user: { id: 'user-id' } } as unknown as Request;

      const result = await controller.getCurrentCityCreationRequest(req);

      expect(
        mockCityCreationService.getCurrentCityCreationRequest,
      ).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('joinCity', () => {
    it('should throw UnauthorizedException if request user is missing', async () => {
      const req = { user: undefined } as unknown as Request;
      await expect(controller.joinCity('city-id', req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call service.joinCity with city id and user id', async () => {
      const expectedResult = { id: 'city-id' };
      mockCityService.joinCity.mockResolvedValue(expectedResult);
      const req = { user: { id: 'user-id' } } as unknown as Request;

      const result = await controller.joinCity('city-id', req);

      expect(mockCityService.joinCity).toHaveBeenCalledWith(
        'city-id',
        'user-id',
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
