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

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

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
      const userStatusWithReferralCode = await this.findUserStatusByReferralCode(referral_code_of_referrer)
      const DEFAULT_CODE = 'DEFAULT_';
      const newUserStatus = this.userStatusRepository.create({
        user: user,
        personal_referral_code: `${DEFAULT_CODE}${user_id}`,
        total_purchase: '0', // checked
        total_orders:  0, // checked
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
  async findUserStatusByReferralCode(referralCode: string): Promise<UserStatus> {
    try {
      const referrer = await this.userStatusRepository.findOne({
        where: { personal_referral_code: referralCode },
      })

      return referrer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from find user status by referral code service');
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

  async findOne(id: number): Promise<UserStatus> {
    try {
      const userStatus = await this.userStatusRepository.findOne({
        where: { user: { id: id } },
      });
      if (!userStatus) {
        throw new NotFoundException('User status not found');
      }
      return userStatus;
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
      });

      if (!userStatus) {
        throw new Error(`UserStatus not found for user ${payload.userId}`);
      }
      const currentTotal = Number(userStatus.total_purchase);
      const orderAmount = Number(payload.orderAmount);

      userStatus.total_purchase = (currentTotal + orderAmount).toString();
      userStatus.total_orders += 1;

      // TODO: Update user rank based on total purchase
      //  const newRank = this.calculateUserRank(userStatus.total_purchase);
      //  if (newRank !== userStatus.user_rank) {
      //    userStatus.user_rank = newRank;
      //    userStatus.last_rank_update = new Date();
         
      //    // Emit rank change event if needed
      //    this.eventEmitter.emit('user.rank.changed', {
      //      userId: payload.userId,
      //      oldRank: userStatus.user_rank,
      //      newRank: newRank,
      //    });
      //  }

      await this.userStatusRepository.save(userStatus);

    } catch (error) {
      throw new BadRequestException(
        `Failed to update user status from handleOrderCompleted Listener in UseStatus Service: ${error.message}`,
      );
    }
  }
  @OnEvent('order.uncompleted')
  async handleOrderUncompleted(payload: { userId: number; orderAmount: string }) {
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
      userStatus.total_purchase = Math.max(0, currentTotal - orderAmount).toString();
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
}
