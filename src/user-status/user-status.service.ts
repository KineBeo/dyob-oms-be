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
import { UserRole } from 'src/enum/rank';
import User from 'src/users/entities/user.entity';

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async create(createUserStatusDto: CreateUserStatusDto) {
    try {
      const { user_id, isAffiliate, total_purchase, total_orders, user_rank } =
        createUserStatusDto;

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
      const newUserStatus = this.userStatusRepository.create({
        user: user,
        isAffiliate: isAffiliate || false,
        total_purchase: total_purchase || '0',
        total_orders: total_orders || 0,
        user_rank: user_rank || UserRole.NVTN,
      });

      return this.userStatusRepository.save(newUserStatus);
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from create user status service',
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
}
