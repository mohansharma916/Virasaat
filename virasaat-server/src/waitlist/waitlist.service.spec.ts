jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('@nestjs/config', () => ({
  ConfigService: class {},
}));

import { WaitlistService } from './waitlist.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let mockWaitlistRepo: any;
  let mockMailService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockWaitlistRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (record) => ({ id: 'mock-uuid', ...record })),
    };

    mockMailService = {
      sendMail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'WAITLIST_START_NUMBER') return '72';
        if (key === 'ADMIN_EMAIL') return 'admin@virasaat.app';
        return null;
      }),
    };

    service = new WaitlistService(
      mockWaitlistRepo,
      mockMailService,
      mockConfigService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinWaitlist', () => {
    it('should assign starting number 72 when database is empty', async () => {
      mockWaitlistRepo.findOne.mockResolvedValue(null);
      mockWaitlistRepo.count.mockResolvedValue(0);

      const qb = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      };
      mockWaitlistRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.joinWaitlist({
        email: 'founder1@example.com',
        fullName: 'Aarav Sharma',
        country: 'India',
        platform: 'Apple iPhone (iOS)',
        source: 'website',
      });

      expect(result.success).toBe(true);
      expect(result.queueNumber).toBe(72);
      expect(mockWaitlistRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'founder1@example.com',
          fullName: 'Aarav Sharma',
          country: 'India',
          platform: 'Apple iPhone (iOS)',
          queueNumber: 72,
        }),
      );
      expect(mockWaitlistRepo.save).toHaveBeenCalled();
    });

    it('should increment by 1 from previous max in DB (72 -> 73)', async () => {
      mockWaitlistRepo.findOne.mockResolvedValue(null);
      mockWaitlistRepo.count.mockResolvedValue(1);

      const qb = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: '72' }),
      };
      mockWaitlistRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.joinWaitlist({
        email: 'founder2@example.com',
        fullName: 'Pooja Verma',
        country: 'India',
        platform: 'Google Android',
      });

      expect(result.success).toBe(true);
      expect(result.queueNumber).toBe(73);
      expect(mockWaitlistRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'founder2@example.com',
          queueNumber: 73,
        }),
      );
      expect(mockWaitlistRepo.save).toHaveBeenCalled();
    });

    it('should return existing queueNumber if email is already registered', async () => {
      mockWaitlistRepo.findOne.mockResolvedValue({
        id: 'existing-id',
        email: 'founder1@example.com',
        queueNumber: 72,
      });

      const result = await service.joinWaitlist({
        email: 'founder1@example.com',
        fullName: 'Aarav Sharma',
      });

      expect(result.success).toBe(true);
      expect(result.alreadyRegistered).toBe(true);
      expect(result.queueNumber).toBe(72);
      expect(mockWaitlistRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return 72 as nextQueueNumber when DB is empty', async () => {
      mockWaitlistRepo.count.mockResolvedValue(0);
      const qb = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      };
      mockWaitlistRepo.createQueryBuilder.mockReturnValue(qb);

      const stats = await service.getStats();
      expect(stats.success).toBe(true);
      expect(stats.totalCount).toBe(0);
      expect(stats.nextQueueNumber).toBe(72);
    });

    it('should return max + 1 as nextQueueNumber when DB has entries', async () => {
      mockWaitlistRepo.count.mockResolvedValue(5);
      const qb = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: '76' }),
      };
      mockWaitlistRepo.createQueryBuilder.mockReturnValue(qb);

      const stats = await service.getStats();
      expect(stats.success).toBe(true);
      expect(stats.totalCount).toBe(5);
      expect(stats.nextQueueNumber).toBe(77);
    });
  });
});
