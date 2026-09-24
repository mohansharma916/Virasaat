import { Test, TestingModule } from '@nestjs/testing';
import { LegacyItemsController } from './legacy-items.controller';

describe('LegacyItemsController', () => {
  let controller: LegacyItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegacyItemsController],
    }).compile();

    controller = module.get<LegacyItemsController>(LegacyItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
