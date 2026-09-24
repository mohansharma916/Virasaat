import { Test, TestingModule } from '@nestjs/testing';
import { LegacyItemsService } from './legacy-items.service';

describe('LegacyItemsService', () => {
  let service: LegacyItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegacyItemsService],
    }).compile();

    service = module.get<LegacyItemsService>(LegacyItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
