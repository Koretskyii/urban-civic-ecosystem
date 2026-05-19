import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CityController } from './city.controller';
import { CityService } from './city.service';

describe('CityController', () => {
  let controller: CityController;

  const mockCityService = {
    generateDomainToken: jest.fn(),
    verifyDomain: jest.fn(),
    joinCity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityController],
      providers: [
        {
          provide: CityService,
          useValue: mockCityService,
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
    it('should call service.generateDomainToken with domain', () => {
      const domain = 'test.com';
      const expectedResult = { token: 'test-token', domain };
      mockCityService.generateDomainToken.mockReturnValue(expectedResult);

      const result = controller.generateDomainToken(domain);

      expect(mockCityService.generateDomainToken).toHaveBeenCalledWith(domain);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyDomain', () => {
    it('should call service.verifyDomain with domain and token', async () => {
      const body = { domain: 'test.com', token: 'test-token' };
      const expectedResult = {
        success: true,
        message: 'Verified',
        domain: body.domain,
      };
      mockCityService.verifyDomain.mockResolvedValue(expectedResult);

      const result = await controller.verifyDomain(body);

      expect(mockCityService.verifyDomain).toHaveBeenCalledWith(
        body.domain,
        body.token,
      );
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
