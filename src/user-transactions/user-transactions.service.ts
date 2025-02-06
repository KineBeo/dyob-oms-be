import { Injectable } from '@nestjs/common';
import { CreateUserTransactionDto } from './dto/create-user-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTransaction } from './entities/user-transaction.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UserTransactionsService {
  constructor(
    @InjectRepository(UserTransaction)
    private userTransactionRepository: Repository<UserTransaction>,
    private readonly usersService: UsersService,
  ) {}

  async create(createUserTransactionDto: CreateUserTransactionDto) {
    try {
      const user_id = createUserTransactionDto.userId;
      const user = await this.usersService.findOne(user_id);

      const transaction = this.userTransactionRepository.create({
        ...createUserTransactionDto,
        user,
      });

      return this.userTransactionRepository.save(transaction);
    } catch (error) {
      console.error('Error creating user transaction', error);
      throw error;
    }
  }

  findAll() {
    return this.userTransactionRepository.find();
  }

  findOne(id: number) {
    try {
      const transaction = this.userTransactionRepository.findOne({
        where: { id },
      });
    } catch (error) {
      console.error('Error finding user transaction', error);
      throw error;
    }
  }

  findByUserId(userId: number) {
    try {
      const transactions = this.userTransactionRepository.find({
        where: { user: { id: userId } },
      });
      return transactions;
    } catch (error) {
      console.error('Error finding user transactions', error);
      throw error;
    }
  }
}
