import { Test, TestingModule } from '@nestjs/testing';
import { Alerts } from './alerts.service';

describe('Alerts', () => {
  let provider: Alerts;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Alerts],
    }).compile();

    provider = module.get<Alerts>(Alerts);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
