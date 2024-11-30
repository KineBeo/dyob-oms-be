import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
import { group } from 'console';

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  private readonly logger = new Logger(UserStatusService.name);

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
   * TODO: THÊM RESET GROUP_SALES
   */
  @Cron('0 30 7 1 * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async resetTotalSalesMonthly() {
    console.log('Resetting total sales for all users', new Date());
    const allUserStatus = await this.userStatusRepository.find();
    allUserStatus.forEach(async (status) => {
      status.total_sales = '0';
      status.group_sales = '0';
      await this.userStatusRepository.save(status);
    });
  }

  /**
   * ! CRON JOBS 2: Tính toán group_sales cuối tháng
   * ! TRUONG HOANG: Sửa ở đây nhé (0 54 11 * * *) 0 là giây, 54 phút, 11 giờ (11h54))
   */
  @Cron('0 30 11 * * *', {
    name: 'calculate-rank',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleCalculateGroupCommission() {
    try {
      if (this.isLastDayOfMonth()) {
        this.logger.log('Cuối tháng rồi em ơi');
        // ! call here
        this.calculateGroupSalesCommission();
      }
    } catch (error) {
      console.error('Error calculating override commission:', error);
      throw new BadRequestException(
        `Failed to calculate override commission: ${error.message}`,
      );
    }
  }
  /**
   * * Helper function to check if today is the last day of the month
   * @returns
   */
  private isLastDayOfMonth(): boolean {
    const today = new Date();
    const tomorrow = new Date(today);
    console.log('Hôm nay', today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    console.log('Ngày mai', tomorrow);

    return tomorrow.getMonth() !== today.getMonth();
  }

  /**
   * * Helper function to calculate group sales commission percentage
   * @param group_sales
   * @returns
   */
  private calculateGroupSalesCommissionPercentage(group_sales: string): number {
    const group_sales_number = Number(group_sales);
    const group_sales_milestone_1 = 5000000;
    const group_sales_milestone_2 = 50000000;
    const group_sales_milestone_3 = 500000000;
    if (group_sales_number >= group_sales_milestone_1) {
      return 0.03;
    } else if (group_sales_number >= group_sales_milestone_2) {
      return 0.06;
    } else if (group_sales_number >= group_sales_milestone_3) {
      return 0.1;
    }
    return 0;
  }

  private async calculateGroupSalesCommission() {
    const allUserStatus = await this.userStatusRepository.find();
    allUserStatus.forEach(async (status) => {
      const commissionPercentage = this.calculateGroupSalesCommissionPercentage(
        status.group_sales,
      );
      console.log('commissionPercentage', commissionPercentage, 'of user', status.id);
      status.commission = (
        Number(status.commission) +
        Number(status.group_sales) * commissionPercentage
      ).toString();
      await this.userStatusRepository.save(status);

      console.log(
        'UserStatus:',
        status.id,
        'User group_sales:',
        status.group_sales,
        'commission:',
        status.commission,
      );
    });
  }

  private generateReferralCode(userId: number): string {
    const timestamp = Date.now().toString(36);
    const userIdHash = userId.toString(36);
    const referralCode = `REF${(userIdHash + timestamp).toUpperCase().slice(0, 8)}`;
    return referralCode;
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

      const referralCode = this.generateReferralCode(user_id);

      const newUserStatus = this.userStatusRepository.create({
        user: user,
        personal_referral_code: referralCode, // checked
        total_purchase: '0', // checked
        total_orders: 0, // checked
        total_sales: '0', // checked
        group_sales: '0', // checked
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
        relations: [
          'referrer',
          'referrer.referrer',
          'referrer.referrer.referrer',
          'referrals',
        ],
      });

      // console.log('userStatus', userStatus, "## end of userStatus ##");

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

      await this.calculateCommission(userStatus, orderAmount);

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
    // console.log('Calculating rank for user:', userStatus.id);
    // console.log('Current rank:', userStatus.user_rank);
    // console.log('Total purchase:', userStatus.total_purchase);
    // console.log('Total sales:', userStatus.total_sales);
    // console.log('Referrals:', userStatus.referrals);
    // TODO: GUEST -> NVKD -> TPKD -> GDKD -> GDV -> GDKV
    // if (
    //   userStatus.user_rank === UserRank.GUEST &&
    //   Number(userStatus.total_purchase) >= 3000000 &&
    //   userStatus.referrals.length >= 1
    // ) {
    //   console.log('đã vào NVKD');
    //   return UserRank.NVKD;
    // }
    // else if (
    //   userStatus.user_rank === UserRank.NVKD &&
    //   Number(userStatus.total_sales) >= 50000000 &&
    //   userStatus.referrals.filter((ref) =>
    //     this.isEqualOrHigherRank(ref.user_rank, UserRank.NVKD),
    //   ).length >= 5
    // ) {
    //   console.log('đã vào TPKD');
    //   return UserRank.TPKD;
    // } else if (
    //   userStatus.user_rank === UserRank.TPKD &&
    //   Number(userStatus.total_sales) >= 150000000 &&
    //   userStatus.referrals.filter((ref) =>
    //     this.isEqualOrHigherRank(ref.user_rank, UserRank.TPKD),
    //   ).length >= 3
    // ) {
    //   console.log('đã vào GDKD');
    //   return UserRank.GDKD;
    // } else if (
    //   userStatus.user_rank === UserRank.GDKD &&
    //   Number(userStatus.total_sales) >= 500000000 &&
    //   userStatus.referrals.filter((ref) =>
    //     this.isEqualOrHigherRank(ref.user_rank, UserRank.GDKD),
    //   ).length >= 3
    // ) {
    //   console.log('đã vào GDV');
    //   return UserRank.GDV;
    // } else if (
    //   userStatus.user_rank === UserRank.GDV &&
    //   Number(userStatus.total_sales) >= 1000000000 &&
    //   userStatus.referrals.filter((ref) =>
    //     this.isEqualOrHigherRank(ref.user_rank, UserRank.GDV),
    //   ).length >= 2
    // ) {
    //   console.log('đã vào GDKV');
    //   return UserRank.GDKV;
    // }
    if (
      userStatus.user_rank === UserRank.GUEST &&
      Number(userStatus.total_purchase) >= 500000
    ) {
      console.log('đã vào NVKD');
      return UserRank.NVKD;
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
  private async calculateCommission(
    userStatus: UserStatus,
    orderAmount: number,
  ): Promise<{ message: string }> {
    // console.log('Calculating commission for user:', userStatus);
    const referrer = userStatus.referrer;
    const referrerOfReferrer = userStatus.referrer?.referrer;
    const referrerOfReferrerOfReferrer =
      userStatus.referrer?.referrer?.referrer;
    // console.log('referrer', referrer);
    // console.log('referrerOfReferrer', referrerOfReferrer);
    // console.log('referrerOfReferrerOfReferrer', referrerOfReferrerOfReferrer);

    // TODO: Kiểm tra xem user có người giới thiệu không và cập nhật hoa hồng và doanh số cho người giới thiệu
    if (referrer && referrer.user_rank === UserRank.NVKD) {
      const referrerStatus = await this.userStatusRepository.findOne({
        where: { user: { id: referrer.id } },
        relations: ['referrals'],
      });

      if (referrerStatus) {
        referrerStatus.total_sales = (
          Number(referrerStatus.total_sales) + orderAmount
        ).toString();

        referrerStatus.commission = (
          Number(referrerStatus.commission) +
          Number(orderAmount) * 0.2
        ).toString();

        referrerStatus.group_sales = (
          Number(referrerStatus.group_sales) + orderAmount
        ).toString();
        await this.userStatusRepository.save(referrerStatus);
      }
    } else {
      console.log('User has no referrer');
    }

    if (referrerOfReferrer && referrerOfReferrer.user_rank === UserRank.NVKD) {
      const referrerOfReferrerStatus = await this.userStatusRepository.findOne({
        where: { user: { id: referrerOfReferrer.id } },
        relations: ['referrals'],
      });

      if (referrerOfReferrerStatus) {
        referrerOfReferrerStatus.commission = (
          Number(referrerOfReferrerStatus.commission) +
          Number(orderAmount) * 0.06
        ).toString();

        referrerOfReferrerStatus.group_sales = (
          Number(referrerOfReferrerStatus.group_sales) + orderAmount
        ).toString();
        await this.userStatusRepository.save(referrerOfReferrerStatus);
      }
    } else {
      console.log('User has no referrer of referrer');
    }

    if (
      referrerOfReferrerOfReferrer &&
      referrerOfReferrerOfReferrer.user_rank === UserRank.NVKD
    ) {
      const referrerOfReferrerOfReferrerStatus =
        await this.userStatusRepository.findOne({
          where: { user: { id: referrerOfReferrerOfReferrer.id } },
          relations: ['referrals'],
        });

      if (referrerOfReferrerOfReferrerStatus) {
        referrerOfReferrerOfReferrerStatus.commission = (
          Number(referrerOfReferrerOfReferrerStatus.commission) +
          Number(orderAmount) * 0.03
        ).toString();

        referrerOfReferrerOfReferrerStatus.group_sales = (
          Number(referrerOfReferrerOfReferrerStatus.group_sales) + orderAmount
        ).toString();
        await this.userStatusRepository.save(
          referrerOfReferrerOfReferrerStatus,
        );
      } else {
        console.log('User has no referrer of referrer of referrer');
      }
    }
    return { message: 'Commission calculated successfully' };
  }
}
