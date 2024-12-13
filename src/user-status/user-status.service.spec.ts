import { Test, TestingModule } from '@nestjs/testing';
import { UserStatusService } from './user-status.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserStatus } from './entities/user-status.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRank } from 'src/enum/rank';
import { UserClass } from 'src/enum/user-class';
import { UserType } from 'src/enum/user_type';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import User from 'src/users/entities/user.entity';

describe('UserStatusService', () => {
  let service: UserStatusService;
  let userStatusRepository: Repository<UserStatus>;
  let userRepository: Repository<User>;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatusService,
        {
          provide: getRepositoryToken(UserStatus),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserStatusService>(UserStatusService);
    userStatusRepository = module.get<Repository<UserStatus>>(
      getRepositoryToken(UserStatus),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('create', () => {
    it('should create a new user status successfully', async () => {
      const mockUser = { id: 1, fullname: 'Test User' } as User;
      const createDto = {
        user_id: 1,
        user_rank: UserRank.GUEST,
        referral_code_of_referrer: null,
        user_class: UserClass.BASIC,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userStatusRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(userStatusRepository, 'create')
        .mockReturnValue({} as UserStatus);
      jest
        .spyOn(userStatusRepository, 'save')
        .mockResolvedValue({} as UserStatus);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(userStatusRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          user_type: UserType.NORMAL,
          user_rank: UserRank.GUEST,
          personal_referral_code: expect.any(String),
        }),
      );
    });

    it('should throw ConflictException if user status already exists', async () => {
      const createDto = {
        user_id: 1,
        user_rank: UserRank.GUEST,
        referral_code_of_referrer: null,
        user_class: UserClass.BASIC,
      };

      jest
        .spyOn(userStatusRepository, 'findOne')
        .mockResolvedValue({} as UserStatus);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const createDto = {
        user_id: 1,
        user_rank: UserRank.GUEST,
        referral_code_of_referrer: null,
        user_class: UserClass.BASIC,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserStatusByReferralCode', () => {
    it('should return null for null or undefined referral code', async () => {
      const result = await service.findUserStatusByReferralCode(null);
      expect(result).toBeNull();
    });

    it('should find user status by referral code', async () => {
      const mockUserStatus = {
        id: 1,
        personal_referral_code: 'REF123',
      } as UserStatus;

      jest
        .spyOn(userStatusRepository, 'findOne')
        .mockResolvedValue(mockUserStatus);

      const result = await service.findUserStatusByReferralCode('REF123');
      expect(result).toEqual(mockUserStatus);
    });
  });

  describe('findOne', () => {
    it('should find user status with relations', async () => {
      const mockUserStatus = {
        id: 1,
        personal_referral_code: 'REF123',
        referrer: {
          id: 2,
          user: { fullname: 'Referrer Name' },
        },
        referrals: [
          {
            id: 3,
            personal_referral_code: 'REF456',
            user: { fullname: 'Referral Name' },
            user_rank: UserRank.GUEST,
          },
        ],
      } as UserStatus;

      jest
        .spyOn(userStatusRepository, 'findOne')
        .mockResolvedValue(mockUserStatus);

      const result = await service.findOne(1);

      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          personal_referral_code: 'REF123',
          referrer_name: 'Referrer Name',
          referrals: expect.arrayContaining([
            expect.objectContaining({
              id: 3,
              personal_referral_code: 'REF456',
              fullname: 'Referral Name',
              user_rank: UserRank.GUEST,
            }),
          ]),
        }),
      );
    });

    it('should throw NotFoundException if user status not found', async () => {
      jest.spyOn(userStatusRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Rank Calculation', () => {
    it('should calculate rank for BASIC user', () => {
      const userStatus = {
        user_rank: UserRank.GUEST,
        user_class: UserClass.BASIC,
        total_purchase: '600000',
      } as UserStatus;

      const result = (service as any).calculateUserRank(userStatus);
      expect(result).toBe(UserRank.NVKD);
    });

    it('should calculate rank for VIP user', () => {
      const userStatus = {
        user_rank: UserRank.GUEST,
        user_class: UserClass.VIP,
        total_purchase: '4000000',
      } as UserStatus;

      const result = (service as any).calculateUserRank(userStatus);
      expect(result).toBe(UserRank.NVKD);
    });
  });

  describe('Commission Calculation', () => {
    it('should calculate commission percentage for BASIC user', () => {
      const commissionPercentage1 = (
        service as any
      ).calculateCommissionPercentage(UserClass.BASIC, 1);
      const commissionPercentage2 = (
        service as any
      ).calculateCommissionPercentage(UserClass.BASIC, 2);
      const commissionPercentage3 = (
        service as any
      ).calculateCommissionPercentage(UserClass.BASIC, 3);

      expect(commissionPercentage1).toBe(0.2);
      expect(commissionPercentage2).toBe(0.06);
      expect(commissionPercentage3).toBe(0.03);
    });

    it('should calculate commission percentage for VIP user', () => {
      const commissionPercentage1 = (
        service as any
      ).calculateCommissionPercentage(UserClass.VIP, 1);
      const commissionPercentage2 = (
        service as any
      ).calculateCommissionPercentage(UserClass.VIP, 2);
      const commissionPercentage3 = (
        service as any
      ).calculateCommissionPercentage(UserClass.VIP, 3);

      expect(commissionPercentage1).toBe(0.25);
      expect(commissionPercentage2).toBe(0.09);
      expect(commissionPercentage3).toBe(0.06);
    });
  });

  describe('Order Events', () => {
    it('should handle order completed event', async () => {
      const mockUserStatus = {
        id: 1,
        user: { id: 1 },
        total_purchase: '1000',
        total_orders: 1,
        user_rank: UserRank.GUEST,
        user_class: UserClass.BASIC,
        referrer: null,
      } as UserStatus;

      jest
        .spyOn(userStatusRepository, 'findOne')
        .mockResolvedValue(mockUserStatus);
      jest
        .spyOn(userStatusRepository, 'save')
        .mockResolvedValue(mockUserStatus);

      const payload = { userId: 1, orderAmount: '500' };
      await service.handleOrderCompleted(payload);

      expect(userStatusRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          total_purchase: '1500',
          total_orders: 2,
        }),
      );
    });

    it('should handle order uncompleted event', async () => {
      const mockUserStatus = {
        id: 1,
        total_purchase: '1000',
        total_orders: 2,
      } as UserStatus;

      jest
        .spyOn(userStatusRepository, 'findOne')
        .mockResolvedValue(mockUserStatus);
      jest
        .spyOn(userStatusRepository, 'save')
        .mockResolvedValue(mockUserStatus);

      const payload = { userId: 1, orderAmount: '500' };
      await service.handleOrderUncompleted(payload);

      expect(userStatusRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          total_purchase: '500',
          total_orders: 1,
        }),
      );
    });
  });
});
