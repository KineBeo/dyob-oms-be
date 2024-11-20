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
import { IsNull, Not, Repository } from 'typeorm';
import { UserRank } from 'src/enum/rank';
import User from 'src/users/entities/user.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  // async onModuleInit() {
  //   // Schedule a monthly reset of total_sales for all users
  //   this.resetTotalSalesMonthly();
  // }

  // @Cron('0 0 1 * *', {
  //   timeZone: 'Asia/Ho_Chi_Minh',
  // })
  // async resetTotalSalesMonthly() {
  //   console.log('Resetting total sales for all users', new Date());
  //   const allUserStatus = await this.userStatusRepository.find();
  //   allUserStatus.forEach(async (status) => {
  //     status.total_sales = '0';
  //     await this.userStatusRepository.save(status);
  //   });
  // }

  /**
   * ! HELPER FUNCTIONS
   */
  private getRankValue(rank: UserRank): number {
    const rankValues = {
      [UserRank.GUEST]: 0,
      [UserRank.NVKD]: 1,
      [UserRank.TPKD]: 2,
      [UserRank.GDKD]: 3,
      [UserRank.GDV]: 4,
      [UserRank.GDKV]: 5,
    };
    return rankValues[rank];
  }

  private isEqualOrHigherRank(rank1: UserRank, rank2: UserRank): boolean {
    console.log('rank1: ', rank1);
    console.log('rank2: ', rank2);
    return this.getRankValue(rank1) >= this.getRankValue(rank2);
  }

  /**
   * ! CRON JOBS 1: RESET TOTAL_SALES VỀ 0 HÀNG THÁNG (ĐẦU THÁNG)
   */

  /**
   * ! CRON JOBS 2: TÍNH TOÁN ĐỒNG CẤP VƯỢT CẤP
   */
  @Cron("0 10 14 * * *", {
    name: 'calculate-rank',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async calculateOverrideCommissionMonthly() {
    try {
      const vietnamTime = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });
      console.log('Calculating override commission for all users', vietnamTime);

      // get all user statuses that have referrer
      const userStatuses = await this.userStatusRepository.find({
        relations: ['referrer'],
        where: {
          referrer: {
            id: Not(IsNull()),
          },
        },
      });

      for (const userStatus of userStatuses) {
        if (!userStatus.referrer) {
          continue;
        }

        if (
          this.isEqualOrHigherRank(
            userStatus.user_rank,
            userStatus.referrer.user_rank,
          )
        ) {
          const refferrer = userStatus.referrer;
          // TODO: Calculate the override commission for the referrer
          const overrideCommission = Number(userStatus.total_sales) * 0.01;

          // TODO: Update the referrer's commission
          refferrer.commission = (
            Number(refferrer.commission) + overrideCommission
          ).toString();

          // * MONITORING
          console.log(`Override commission calculated:`, {
            referrerId: refferrer.id,
            userId: userStatus.id,
            userRank: userStatus.user_rank,
            referrerRank: userStatus.referrer.user_rank,
            userTotalSales: userStatus.total_sales,
            overrideCommission: overrideCommission,
            newConmission: refferrer.commission,
          });

          await this.userStatusRepository.save(userStatus.referrer);
        }
      }
      console.log('Override commission calculation completed:', vietnamTime);
    } catch (error) {
      console.error('Error calculating override commission:', error);
      throw new BadRequestException(
        `Failed to calculate override commission: ${error.message}`,
      );
    }
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
        where: { id },
        relations: ['referrer', 'referrals', 'referrals.user'],
      });

      if (!userStatus) {
        throw new NotFoundException('User status not found');
      }

      const referrals = await Promise.all(
        userStatus.referrals.map(async (referral) => ({
          id: referral.id,
          personal_referral_code: referral.personal_referral_code,
          user_rank: referral.user_rank,
          total_sales: referral.total_sales,
          fullname: referral.user?.fullname || null,
        })),
      );

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
        referrer_name: userStatus.referrer?.user?.fullname || null,
        referrals,
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
        relations: ['referrer', 'referrals'],
      });

      console.log('userStatus', userStatus);

      if (!userStatus) {
        throw new Error(`UserStatus not found for user ${payload.userId}`);
      }

      if (!userStatus.referrals) {
        userStatus.referrals = [];
      }

      const currentTotal = Number(userStatus.total_purchase);
      const orderAmount = Number(payload.orderAmount);

      userStatus.total_purchase = (currentTotal + orderAmount).toString();
      userStatus.total_orders += 1;

      // TODO: Cập nhật rank cho user hiện tại
      const newRank = this.calculateUserRank(userStatus);

      if (newRank !== userStatus.user_rank) {
        const oldRank = userStatus.user_rank;
        userStatus.user_rank = newRank;
        userStatus.rank_achievement_date = new Date();

        this.eventEmitter.emit('user.rank.updated', {
          userId: payload.userId,
          oldRank: oldRank,
          newRank: newRank,
        });
      }

      const referrer = userStatus.referrer;

      // TODO: Kiểm tra xem user có người giới thiệu không và cập nhật hoa hồng và doanh số cho người giới thiệu
      if (referrer) {
        const referrerStatus = await this.userStatusRepository.findOne({
          where: { user: { id: referrer.id } },
          relations: ['referrals']
        });
        if (referrerStatus) {
          referrerStatus.total_sales = (
            Number(referrerStatus.total_sales) + orderAmount
          ).toString();

          referrerStatus.commission = (
            Number(referrerStatus.commission) +
            this.calculateCommission(referrerStatus, orderAmount)
          ).toString();

          await this.userStatusRepository.save(referrerStatus);

          const referrerRank = referrerStatus.user_rank;
          const referrerNewRank = this.calculateUserRank(referrerStatus);
          if (referrerNewRank !== referrerRank) {
            referrerStatus.user_rank = referrerNewRank;
            referrerStatus.rank_achievement_date = new Date();

            console.log('Referrer rank updated to:', referrerNewRank);
            await this.userStatusRepository.save(referrerStatus);
          }
        }
      } else {
        console.log('User has no referrer');
      }

      await this.userStatusRepository.save(userStatus);
    } catch (error) {
      console.error(
        `Failed to update user status from handleOrderCompleted Listener in UseStatus Service: ${error.message}`,
      );
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
      // console.log('userStatus.total_purchase', userStatus.total_purchase);
      userStatus.total_orders = Math.max(0, userStatus.total_orders - 1);

      // TODO: Update user rank based on total purchase like in handleOrderCompleted

      await this.userStatusRepository.save(userStatus);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update user status from handleOrderUncompleted Listener in UseStatus Service: ${error.message}`,
      );
    }
  }

  /**
   *
   * ! TÍNH TOÁN RANK CHO USER
   * * RETURN: UserRank
   */
  private calculateUserRank(userStatus: UserStatus): UserRank {
    console.log('Calculating rank for user:', userStatus.id);
    console.log('Current rank:', userStatus.user_rank);
    console.log('Total purchase:', userStatus.total_purchase);
    console.log('Total sales:', userStatus.total_sales);
    console.log('Referrals:', userStatus.referrals);
    // TODO: GUEST -> NVKD -> TPKD -> GDKD -> GDV -> GDKV
    if (
      userStatus.user_rank === UserRank.GUEST &&
      Number(userStatus.total_purchase) >= 3000000 &&
      userStatus.referrals.length >= 1
    ) {
      console.log('đã vào NVKD');
      return UserRank.NVKD;
    } else if (
      userStatus.user_rank === UserRank.NVKD &&
      Number(userStatus.total_sales) >= 50000000 &&
      userStatus.referrals.filter((ref) =>
        this.isEqualOrHigherRank(ref.user_rank, UserRank.NVKD),
      ).length >= 5
    ) {
      console.log('đã vào TPKD');
      return UserRank.TPKD;
    } else if (
      userStatus.user_rank === UserRank.TPKD &&
      Number(userStatus.total_sales) >= 150000000 &&
      userStatus.referrals.filter((ref) =>
        this.isEqualOrHigherRank(ref.user_rank, UserRank.TPKD),
      ).length >= 3
    ) {
      console.log('đã vào GDKD');
      return UserRank.GDKD;
    } else if (
      userStatus.user_rank === UserRank.GDKD &&
      Number(userStatus.total_sales) >= 500000000 &&
      userStatus.referrals.filter((ref) =>
        this.isEqualOrHigherRank(ref.user_rank, UserRank.GDKD),
      ).length >= 3
    ) {
      console.log('đã vào GDV');
      return UserRank.GDV;
    } else if (
      userStatus.user_rank === UserRank.GDV &&
      Number(userStatus.total_sales) >= 1000000000 &&
      userStatus.referrals.filter((ref) =>
        this.isEqualOrHigherRank(ref.user_rank, UserRank.GDV),
      ).length >= 2
    ) {
      console.log('đã vào GDKV');
      return UserRank.GDKV;
    }

    // TODO: trả về rank ban đầu
    return userStatus.user_rank;
  }

  /**
   *
   * @param userStatus
   * @param orderAmount
   * * RETURN: NUMBER
   *
   * ! TÍNH TOÁN HOA HỒNG CHO USER
   */
  private calculateCommission(
    userStatus: UserStatus,
    orderAmount: number,
  ): number {
    switch (userStatus.user_rank) {
      case UserRank.NVKD:
        return Number(orderAmount) * 0.2;
      case UserRank.TPKD:
        return Number(orderAmount) * 0.05;
      case UserRank.GDKD:
        return Number(orderAmount) * 0.04;
      case UserRank.GDV:
        return Number(orderAmount) * 0.03;
      case UserRank.GDKV:
        return Number(orderAmount) * 0.02;
      default:
        return 0;
    }
  }
}
