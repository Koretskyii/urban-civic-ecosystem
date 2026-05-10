import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  let provider: AlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsService],
    }).compile();

    provider = module.get<AlertsService>(AlertsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
