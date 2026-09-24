import { Test, TestingModule } from '@nestjs/testing';
import { RecipientController } from './recipients.controller';
import { RecipientService } from './recipients.service';

describe('RecipientController', () => {
  let controller: RecipientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipientController],
      providers: [RecipientService],
    }).compile();

    controller = module.get<RecipientController>(RecipientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
