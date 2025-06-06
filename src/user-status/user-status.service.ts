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
import { Repository } from 'typeorm';
import { UserRank } from 'src/enum/rank';
import User from 'src/users/entities/user.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserType } from 'src/enum/user_type';
import { UserClass } from 'src/enum/user-class';
import { UserTransactionsService } from 'src/user-transactions/user-transactions.service';

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
    private readonly userTransactionService: UserTransactionsService,
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
   * ! CRON JOBS 1: RESET TOTAL_SALES, COMMISSION VỀ 0 HÀNG THÁNG (ĐẦU THÁNG)
   * * OK CHECKED
   */
  @Cron('10 0 1 * *', {
    name: 'reset-total-sales-monthly',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async resetTotalSalesMonthly() {
    console.log('Resetting total sales for all users', new Date());
    const allUserStatus = await this.userStatusRepository.find();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    allUserStatus.forEach(async (status) => {
      this.userTransactionService.reset(status, yesterday);
    });
  }

  // /**
  //  * ! CRON JOBS 2: RESET GROUP_SALES, GROUP_COMMISSION VỀ 0 HÀNG QUÝ (ĐẦU QUÝ)
  //  * * OK CHECKED
  //  */
  // @Cron('30 0 1 1,4,7,10 *', {
  //   name: 'reset-group-sales-quarterly',
  //   timeZone: 'Asia/Ho_Chi_Minh',
  // })
  // async resetGroupSalesQuarterly() {
  //   console.log('Resetting group sales for all users', new Date());
  //   const allUserStatus = await this.userStatusRepository.find();
  //   allUserStatus.forEach(async (status) => {
  //     status.group_sales = '0';
  //     status.group_commission = '0';
  //     await this.userStatusRepository.save(status);
  //   });
  // }

  /**
   * ! CRON JOBS 3: LƯU HOA HỒNG, THƯỞNG NHÓM CHO TẤT CẢ USER HÀNG THÁNG
   */
  @Cron('50 23 * * *', {
    name: 'store-commission-history-monthly',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async storeCommissionHistoryMonthly() {
    try {
      if (this.isLastDayOfMonth()) {
        this.logger.log('Cuối tháng rồi em ơi');
        // ! Emit event to store commission history
        this.eventEmitter.emit('storeCommissionHistoryMonthly');
      }
    } catch (error) {
      console.error('Error in store commission history cronjob ', error);
      throw new BadRequestException(
        `Failed to store commission history cronjob : ${error.message}`,
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

    // return true;
    return tomorrow.getMonth() !== today.getMonth();
  }

  /**
   * * Helper function to calculate group sales commission percentage
   * @param group_sales
   * @returns
   */
  private calculateGroupSalesCommissionPercentage(
    group_sales: string,
    user_class: UserClass,
  ): number {
    const group_sales_percentage = {
      [UserClass.BASIC]: {
        milestone_1: 5000000, // 5 triệu -> 5 triệu chỉnh sửa 15h 8/12/2024
        milestone_2: 50000000, // 50 triệu -> 50 triệu chỉnh sửa 15h 8/12/2024
        milestone_3: 500000000, // 500 triệu -> 500 triệu chỉnh sửa 15h 8/12/2024
        commission_percentage_milestone_1: 0.03, // 3% -> 3% chỉnh sửa 15h 8/12/2024
        commission_percentage_milestone_2: 0.06, // 6% -> 6% chỉnh sửa 15h 8/12/2024
        commission_percentage_milestone_3: 0.1, // 10% -> 10% chỉnh sửa 15h 8/12/2024
      },
      [UserClass.VIP]: {
        milestone_1: 30000000, // 60 triệu -> 30 triệu chỉnh sửa 15h 8/12/2024
        milestone_2: 200000000, // 120 triệu -> 200 triệu chỉnh sửa 15h 8/12/2024
        milestone_3: 500000000, // 500 triệu -> 500 triệu chỉnh sửa 15h 8/12/2024
        commission_percentage_milestone_1: 0.05, // 5% -> 5% chỉnh sửa 15h 8/12/2024
        commission_percentage_milestone_2: 0.08, // 10% -> 8% chỉnh sửa 15h 8/12/2024
        commission_percentage_milestone_3: 0.1, // 15% -> 10% chỉnh sửa 15h 8/12/2024
      },
    };

    const group_sales_number = Number(group_sales);
    // console.log(
    //   'group_sales_number',
    //   group_sales_number,
    //   'user_class',
    //   user_class,
    // );
    if (user_class === UserClass.BASIC) {
      if (
        group_sales_number >= group_sales_percentage[user_class].milestone_3
      ) {
        return group_sales_percentage[user_class]
          .commission_percentage_milestone_3;
      }

      if (
        group_sales_number >= group_sales_percentage[user_class].milestone_2 &&
        group_sales_number < group_sales_percentage[user_class].milestone_3
      ) {
        return group_sales_percentage[user_class]
          .commission_percentage_milestone_2;
      }

      if (
        group_sales_number >= group_sales_percentage[user_class].milestone_1 &&
        group_sales_number < group_sales_percentage[user_class].milestone_2
      ) {
        return group_sales_percentage[user_class]
          .commission_percentage_milestone_1;
      }
    }

    if (user_class === UserClass.VIP) {
      if (
        group_sales_number >= group_sales_percentage[user_class].milestone_3
      ) {
        return group_sales_percentage[user_class]
          .commission_percentage_milestone_3;
      }

      if (
        group_sales_number >= group_sales_percentage[user_class].milestone_2
      ) {
        return group_sales_percentage[user_class]
          .commission_percentage_milestone_2;
      }

      if (
        group_sales_number >= group_sales_percentage[user_class].milestone_1
      ) {
        return group_sales_percentage[user_class]
          .commission_percentage_milestone_1;
      }
    }

    return 0;
  }

  // private calulateGroupSalesCommission(userStatus: UserStatus): number {
  //   const group_sales = Number(userStatus.group_sales);

  //   const group_commission =
  //     this.calculateGroupSalesCommissionPercentage(
  //       userStatus.group_sales,
  //       userStatus.user_class,
  //     ) * group_sales;

  //   console.log('group_commission', group_commission);
  //   return group_commission;
  // }

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
      const { user_id, user_rank, referral_code_of_referrer, user_class } =
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

      // * Nếu user có referrer thì user-class phải được điền
      if (
        userStatusWithReferralCode &&
        (user_class === null || user_class === undefined)
      ) {
        throw new BadRequestException('User class is required');
      }

      let user_type = UserType.NORMAL;
      if (userStatusWithReferralCode) {
        user_type = UserType.AFFILIATE;
      }
      // console.log('User type:', user_type);

      const referralCode = this.generateReferralCode(user_id);

      const newUserStatus = this.userStatusRepository.create({
        user: user,
        personal_referral_code: referralCode, // checked
        total_purchase: '0', // checked
        total_orders: 0, // checked
        total_sales: '0', // checked
        bonus: '0', // checked
        // group_sales: '0', // checked
        commission: '0', // checked
        // group_commission: '0', // checked
        user_type: user_type, // checked
        user_class: user_class, // checked
        referrer: userStatusWithReferralCode || null, // checked
        user_rank: user_rank || UserRank.GUEST, // checked
        createdAt: new Date(),
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
        relations: ['referrer', 'referrals', 'referrals.user', 'referrer.user'],
      });

      if (!userStatus) {
        throw new NotFoundException('User status not found');
      }

      const referrals = await Promise.all(
        userStatus.referrals.map(async (referral) => ({
          id: referral.id,
          personal_referral_code: referral.personal_referral_code,
          referrer_name: referral.referrer?.user?.fullname || null,
          user_rank: referral.user_rank,
          total_sales: referral.total_sales,
          fullname: referral.user?.fullname || null,
        })),
      );

      return {
        id: userStatus.id,
        personal_referral_code: userStatus.personal_referral_code,
        user_type: userStatus.user_type,
        user_class: userStatus.user_class,
        total_purchase: userStatus.total_purchase,
        total_orders: userStatus.total_orders,
        total_sales: userStatus.total_sales,
        bonus: userStatus.bonus,
        // group_sales: userStatus.group_sales,
        commission: userStatus.commission,
        // group_commission: userStatus.group_commission,
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

  async findReferralLevels(id: number) {
    try {
      // Tìm kiếm user status với mối quan hệ ban đầu
      const userStatus = await this.userStatusRepository.findOne({
        where: { id },
        relations: [
          'referrals',
          'referrals.referrer.user',
          'referrals.user',
          'referrals.referrals',
          'referrals.referrals.referrer.user',
          'referrals.referrals.user',
          'referrals.referrals.referrals',
          'referrals.referrals.referrals.referrer.user',
          'referrals.referrals.referrals.user',
          'referrals.referrals.referrals.referrals',
          'referrals.referrals.referrals.referrals.referrer.user',
          'referrals.referrals.referrals.referrals.user',
        ],
      });

      if (!userStatus) {
        throw new NotFoundException('User status not found');
      }

      // Hàm để xử lý từng cấp referral
      const processReferralLevel = (referrals) => {
        return referrals.map((referral) => ({
          id: referral.id,
          fullname: referral.user?.fullname || null,
          user_rank: referral.user_rank,
          total_purchase: referral.total_purchase,
          total_sales: referral.total_sales,
          createdAt: referral.createdAt,
          referrer_name: referral.referrer?.user?.fullname || null,
          referrals: referral.referrals
            ? processReferralLevel(referral.referrals)
            : [],
        }));
      };

      // Xử lý các tầng referral
      const processedReferrals = processReferralLevel(userStatus.referrals);

      return processedReferrals;
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find referral levels service',
      );
    }
	}
	
	async findReferrerByUserId(userId: number) {
	const userStatus = await this.userStatusRepository.findOne({
		where: { user: { id: userId } },
		relations: ['referrer', 'referrals', 'referrals.user', 'referrer.user'],
	});

	if (!userStatus) {
		throw new NotFoundException(`User status not found with userId ${userId}`);
	}

		return {
			id: userStatus.id,
			personal_referral_code: userStatus.personal_referral_code
		};
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
          'referrer.referrer.referrer.referrer',
          'referrals',
          'user',
        ],
      });

      // console.log('userStatus', userStatus, '## end of userStatus ##');

      if (!userStatus) {
        throw new Error(`UserStatus not found for user ${payload.userId}`);
      }

      if (!userStatus.referrals) {
        userStatus.referrals = [];
      }

      const currentTotal = Number(userStatus.total_purchase);
      const orderAmount = Number(payload.orderAmount);

      // userStatus.total_purchase = (currentTotal + orderAmount).toString();
      // userStatus.total_orders += 1;

      this.userTransactionService.purchase(
        userStatus,
        orderAmount.toString(),
        'Bạn đã mua đơn hàng ',
      );

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
      // console.log('Trước khi tính hoa hồng');

      await this.calculateCommission(userStatus, orderAmount);

      // console.log('Sau khi tính hoa hồng');

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
    if (
      userStatus.user_rank === UserRank.GUEST &&
      userStatus.user_class === UserClass.BASIC &&
      Number(userStatus.total_purchase) >= 500000
    ) {
      console.log('đã vào NVKD với quyền lợi BASIC');
      return UserRank.NVKD;
    }

    if (
      userStatus.user_rank === UserRank.GUEST &&
      userStatus.user_class === UserClass.VIP &&
      Number(userStatus.total_purchase) >= 3000000
    ) {
      console.log('đã vào NVKD với quyền lợi VIP');
      return UserRank.NVKD;
    }

    // TODO: trả về rank ban đầu
    return userStatus.user_rank;
  }

  private calculateCommissionPercentage(
    user_class: UserClass,
    upperLevel: number,
  ) {
    const basicCommissionPercentage = [0.2, 0.06, 0.03]; // checked 15h 8/12/2024
    const vipCommissionPercentage = [0.25, 0.09, 0.05]; // checked 22h 7/2/2025

    if (user_class === UserClass.BASIC) {
      return basicCommissionPercentage[upperLevel - 1];
    } else if (user_class === UserClass.VIP) {
      return vipCommissionPercentage[upperLevel - 1];
    }

    return 0;
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
    const fullname = userStatus.user.fullname;

    const father = userStatus.referrer;
    const grandpa = userStatus.referrer?.referrer;
    const greatGrandpa = userStatus.referrer?.referrer?.referrer;
    const referrerOfReferrerOfReferrerOfReferrer =
      userStatus.referrer?.referrer?.referrer?.referrer;
    // console.log('Cha', father);
    // console.log('Ông', grandpa);
    // console.log('Cụ', greatGrandpa);

    // * CHECK cha
    if (father && father.user_rank === UserRank.NVKD) {
      const fatherState = await this.userStatusRepository.findOne({
        where: { user: { id: father.id } },
        relations: ['referrals', 'user'],
      });

      if (fatherState) {
        // referrerStatus.total_sales = (
        //   Number(referrerStatus.total_sales) + orderAmount
        // ).toString();

        // * Tính total_sale và thưởng
        this.userTransactionService.sales(
          fatherState,
          orderAmount.toString(),
          `Đơn hàng từ người dùng ${fullname}`,
        );

        // * Tính hoa hồng
        const commission = (
          Number(orderAmount) *
          this.calculateCommissionPercentage(fatherState.user_class, 1)
        ).toString();

        // * Tạo transaction cho cha
        this.userTransactionService.commission(
          fatherState,
          commission,
          'Hoa hồng nhận được từ người dùng ' + fullname,
        );

        // referrerStatus.bonus = this.calculateBonus(referrerStatus).toString();

        // referrerStatus.group_sales = (
        //   Number(referrerStatus.group_sales) + orderAmount
        // ).toString();
        // referrerStatus.group_commission =
        //   this.calulateGroupSalesCommission(referrerStatus).toString();
      }
    } else {
      console.log('User has no referrer');
    }

    // * CHECK ÔNG
    if (grandpa && grandpa.user_rank === UserRank.NVKD) {
      const grandpaState = await this.userStatusRepository.findOne({
        where: { user: { id: grandpa.id } },
        relations: ['referrals', 'user'],
      });

      if (grandpaState) {
        // * Tính hoa hồng cho ông
        const commission = (
          Number(orderAmount) *
          this.calculateCommissionPercentage(grandpaState.user_class, 2)
        ).toString();

        this.userTransactionService.commission(
          grandpaState,
          commission,
          'Hoa hồng nhận được từ người dùng ' + fullname,
        );

        // referrerOfReferrerStatus.group_sales = (
        //   Number(referrerOfReferrerStatus.group_sales) + orderAmount
        // ).toString();
        // referrerOfReferrerStatus.group_commission =
        //   this.calulateGroupSalesCommission(
        //     referrerOfReferrerStatus,
        //   ).toString();
      }
    } else {
      console.log('User has no referrer of referrer');
    }

    // * CHECK CỤ
    if (greatGrandpa && greatGrandpa.user_rank === UserRank.NVKD) {
      const greatGrandpaState = await this.userStatusRepository.findOne({
        where: { user: { id: greatGrandpa.id } },
        relations: ['referrals', 'user'],
      });

      if (greatGrandpaState) {
        // * Tính hoa hồng cho cụ
        const commission = (
          Number(orderAmount) *
          this.calculateCommissionPercentage(greatGrandpaState.user_class, 3)
        ).toString();

        this.userTransactionService.commission(
          greatGrandpaState,
          commission,
          'Hoa hồng nhận được từ người dùng ' + fullname,
        );

        // referrerOfReferrerOfReferrerStatus.group_sales = (
        //   Number(referrerOfReferrerOfReferrerStatus.group_sales) + orderAmount
        // ).toString();
        // referrerOfReferrerOfReferrerStatus.group_commission =
        //   this.calulateGroupSalesCommission(
        //     referrerOfReferrerOfReferrerStatus,
        //   ).toString();
        // await this.userStatusRepository.save(
        //   referrerOfReferrerOfReferrerStatus,
        // );
      } else {
        console.log('User has no referrer of referrer of referrer');
      }
    }
    if (
      referrerOfReferrerOfReferrerOfReferrer &&
      referrerOfReferrerOfReferrerOfReferrer.user_rank === UserRank.NVKD
    ) {
      const referrerOfReferrerOfReferrerOfReferrerStatus =
        await this.userStatusRepository.findOne({
          where: { user: { id: referrerOfReferrerOfReferrerOfReferrer.id } },
          relations: ['referrals'],
        });

      // if (referrerOfReferrerOfReferrerOfReferrerStatus) {
      //   referrerOfReferrerOfReferrerOfReferrerStatus.group_sales = (
      //     Number(referrerOfReferrerOfReferrerOfReferrerStatus.group_sales) +
      //     orderAmount
      //   ).toString();
      //   referrerOfReferrerOfReferrerOfReferrerStatus.group_commission =
      //     this.calulateGroupSalesCommission(
      //       referrerOfReferrerOfReferrerOfReferrerStatus,
      //     ).toString();
      //   await this.userStatusRepository.save(
      //     referrerOfReferrerOfReferrerOfReferrerStatus,
      //   );
      // }
    } else {
      console.log('User has no referrer of referrer of referrer');
    }
    return { message: 'Commission calculated successfully' };
  }
}
