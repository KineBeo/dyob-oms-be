import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserStatusDto } from './dto/create-user-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus } from './entities/user-status.entity';
import { Repository } from 'typeorm';
import { UserRank } from 'src/enum/rank';
import User from 'src/users/entities/user.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
    // @InjectQueue('user-rank-update') private userRankUpdateQueue: Queue,

  ) {}

  async onModuleInit() {
    // Schedule a monthly reset of total_sales for all users
    this.resetTotalSalesMonthly();
  }

  @Cron('0 0 1 * *', {
    timeZone: 'Asia/Ho_Chi_Minh', 
  })
  async resetTotalSalesMonthly() {
    const allUserStatus = await this.userStatusRepository.find();
    allUserStatus.forEach(async (status) => {
      status.total_sales = '0';
      await this.userStatusRepository.save(status);
    });
  }
  /**
   * ! CRUD OPERATIONS
   * @param createUserStatusDto
   * @returns
   */
  async create(createUserStatusDto: CreateUserStatusDto) {
    try {
      const { user_id, user_rank, referral_code_of_referrer } =
        createUserStatusDto;

      // * Check if user status already exists
      const existingStatus = await this.userStatusRepository.findOne({
        where: { user: { id: user_id } },
      });
      if (existingStatus) {
        throw new ConflictException('User status already exists');
      }

      // Find the user entity
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // * Check if referrer exists
      const userStatusWithReferralCode =
        await this.findUserStatusByReferralCode(referral_code_of_referrer);
      const DEFAULT_CODE = 'DEFAULT_';
      const newUserStatus = this.userStatusRepository.create({
        user: user,
        personal_referral_code: `${DEFAULT_CODE}${user_id}`,
        total_purchase: '0', // checked
        total_orders: 0, // checked
        total_sales: '0', // checked
        commission: '0', // checked
        referrer: userStatusWithReferralCode || null, // checked
        user_rank: user_rank || UserRank.GUEST, // checked
      });

      return this.userStatusRepository.save(newUserStatus);
    } catch (error) {
      throw error;
    }
  }
  async findUserStatusByReferralCode(
    referralCode: string,
  ): Promise<UserStatus> {
    try {
      if (referralCode === null || referralCode === undefined) {
        return null;
      }
      const referrer = await this.userStatusRepository.findOne({
        where: { personal_referral_code: referralCode },
      });
      return referrer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find user status by referral code service',
      );
    }
  }

  async findAll(): Promise<UserStatus[]> {
    try {
      return this.userStatusRepository.find();
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find all user status service',
      );
    }
  }

  async findOne(id: number) {
    try {
      const userStatus = await this.userStatusRepository.findOne({
        where: { user: { id: id } },
        relations: ['referrer'],
      });
      let referrer_name = null;
      if (!userStatus.referrer) {
        referrer_name = null;
      } else {
        const userOfReferralCode = await this.userRepository.findOne({
          where: { id: userStatus.referrer?.id },
        });
        referrer_name = userOfReferralCode?.fullname;
      }

      if (!userStatus) {
        throw new NotFoundException('User status not found');
      }
      return {
        id: userStatus.id,
        personal_referral_code: userStatus.personal_referral_code,
        total_purchase: userStatus.total_purchase,
        total_orders: userStatus.total_orders,
        total_sales: userStatus.total_sales,
        commission: userStatus.commission,
        last_rank_check: userStatus.last_rank_check,
        rank_achievement_date: userStatus.rank_achievement_date,
        user_rank: userStatus.user_rank,
        createdAt: userStatus.createdAt,
        updatedAt: userStatus.updatedAt,
        referrer_id: userStatus.referrer?.id || null,
        referrer_name: referrer_name,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find one user status service',
      );
    }
  }

  update(id: number, updateUserStatusDto: UpdateUserStatusDto) {
    return `This action updates a #${id} userStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} userStatus`;
  }

  /**
   * ! ORDER EVENTS LISTENERS
   */
  @OnEvent('order.completed')
  async handleOrderCompleted(payload: { userId: number; orderAmount: string }) {
    try {
      const userStatus = await this.userStatusRepository.findOne({
        where: { user: { id: payload.userId } },
        relations: ['referrer'],
      });

      if (!userStatus) {
        throw new Error(`UserStatus not found for user ${payload.userId}`);
      }
      const currentTotal = Number(userStatus.total_purchase);
      const orderAmount = Number(payload.orderAmount);

      userStatus.total_purchase = (currentTotal + orderAmount).toString();
      userStatus.total_orders += 1;

      // TODO: Update user rank based on total purchase
      if (userStatus.referrer) {
        const referrerStatus = await this.userStatusRepository.findOne({
          where: { user: { id: userStatus.referrer.id } },
        });

        if (referrerStatus) {
          referrerStatus.total_sales = (
            Number(referrerStatus.total_sales) + orderAmount
          ).toString();
          await this.userStatusRepository.save(referrerStatus);
        }
      }

      // Calculate and update user's own commission
    const commission = this.calculateCommission(userStatus.referrer);
    userStatus.referrer.commission = commission.toString();

      const newRank = this.calculateUserRank(userStatus);
      if (newRank !== userStatus.user_rank) {
        userStatus.user_rank = newRank;
        userStatus.rank_achievement_date = new Date();

        this.eventEmitter.emit('user.rank.updated', {
          userId: payload.userId,
          oldRank: userStatus.user_rank,
          newRank: newRank,
        });

        // await this.userRankUpdateQueue.add('update-rank', { userId: payload.userId, newRank });
      }

      await this.userStatusRepository.save(userStatus);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update user status from handleOrderCompleted Listener in UseStatus Service: ${error.message}`,
      );
    }
  }
  @OnEvent('order.uncompleted')
  async handleOrderUncompleted(payload: {
    userId: number;
    orderAmount: string;
  }) {
    try {
      const userStatus = await this.userStatusRepository.findOne({
        where: { user: { id: payload.userId } },
      });

      if (!userStatus) {
        throw new Error(`UserStatus not found for user ${payload.userId}`);
      }

      // Convert string amounts to numbers for calculation
      const currentTotal = Number(userStatus.total_purchase);
      const orderAmount = Number(payload.orderAmount);

      // Update total purchase (ensure it doesn't go below 0)
      userStatus.total_purchase = Math.max(
        0,
        currentTotal - orderAmount,
      ).toString();
      console.log('userStatus.total_purchase', userStatus.total_purchase);
      userStatus.total_orders = Math.max(0, userStatus.total_orders - 1);

      // TODO: Update user rank based on total purchase like in handleOrderCompleted

      await this.userStatusRepository.save(userStatus);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update user status from handleOrderUncompleted Listener in UseStatus Service: ${error.message}`,
      );
    }
  }

  private calculateUserRank(userStatus: UserStatus): UserRank {
    // Implement the logic to calculate the user's rank based on the given criteria
    if (Number(userStatus.total_purchase) >= 3000000 && userStatus.referrer) {
      return UserRank.NVKD;
    } else if (Number(userStatus.total_sales) >= 50000000 && userStatus.referrals.filter(ref => ref.user_rank >= UserRank.NVKD).length >= 5) {
      return UserRank.TPKD;
    } else if (Number(userStatus.total_sales) >= 150000000 && userStatus.referrals.filter(ref => ref.user_rank >= UserRank.TPKD).length >= 3) {
      return UserRank.GDKD;
    } else if (Number(userStatus.total_sales) >= 500000000 && userStatus.referrals.filter(ref => ref.user_rank >= UserRank.GDKD).length >= 3) {
      return UserRank.GDV;
    } else if (Number(userStatus.total_sales) >= 1000000000 && userStatus.referrals.filter(ref => ref.user_rank >= UserRank.GDV).length >= 2) {
      return UserRank.GDKV;
    } else {
      return UserRank.GUEST;
    }
  }
  private calculateCommission(userStatus: UserStatus): number {
    switch (userStatus.user_rank) {
      case UserRank.NVKD:
        return Number(userStatus.total_sales) * 0.1;
      case UserRank.TPKD:
        return Number(userStatus.total_sales) * 0.05;
      case UserRank.GDKD:
        return Number(userStatus.total_sales) * 0.03;
      case UserRank.GDV:
        return Number(userStatus.total_sales) * 0.02;
      case UserRank.GDKV:
        return Number(userStatus.total_sales) * 0.02;
      default:
        return 0;
    }
  }
}