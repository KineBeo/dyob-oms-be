import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTransaction } from './entities/user-transaction.entity';
import { UsersService } from 'src/users/users.service';
import { UserStatus } from 'src/user-status/entities/user-status.entity';
import { TransactionType } from 'src/enum/transactionType';
import { CreateUserTransactionDto } from './dto/create-user-transaction.dto';

@Injectable()
export class UserTransactionsService {
  constructor(
    @InjectRepository(UserTransaction)
    private userTransactionRepository: Repository<UserTransaction>,
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
  ) {}

  async create(CreateUserTransactionDto: CreateUserTransactionDto) {
    try {
      const user_status = await this.userStatusRepository.findOne({
        where: { id: CreateUserTransactionDto.user_status_id },
      });

      if (!user_status) {
        throw new NotFoundException('User status not found');
      }

      const transaction = this.userTransactionRepository.create({
        amount: CreateUserTransactionDto.amount,
        type: CreateUserTransactionDto.transaction_type,
        description: CreateUserTransactionDto.description,
        userStatus: user_status,
      });
      await this.userTransactionRepository.save(transaction);
    } catch (error) {
      console.error('Error creating user transaction', error);
      throw error;
    }
  }

  findAll() {
    return this.userTransactionRepository.find();
  }

  async findOne(id: number, userId: number) {
    try {
      const transaction = await this.userTransactionRepository.findOne({
        where: { id },
        relations: ['userStatus.user'],
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.userStatus.user.id !== userId) {
        throw new NotFoundException('Transaction not found');
      }

      return transaction;
    } catch (error) {
      console.error('Error finding user transaction', error);
      throw error;
    }
  }

  findByUserId(userId: number) {
    try {
      const transactions = this.userTransactionRepository.find({
        where: { userStatus: { user: { id: userId } } },
      });
      return transactions;
    } catch (error) {
      console.error('Error finding user transactions', error);
      throw error;
    }
  }

  /**
   * * Xử lý giao dịch thưởng
   * @param user_status
   * @param amount tổng tiền thưởng của người dùng trong tháng này
   * @param note
   * @returns
   */
  async bonus(user_status: UserStatus, amount: string, note?: string) {
    const increateAmount = Number(amount) - Number(user_status.bonus);

    user_status.bonus = amount;

    this.create({
      user_status_id: user_status.id,
      amount: String(increateAmount),
      transaction_type: TransactionType.BONUS,
      description: note,
    });
    return this.userStatusRepository.save(user_status);
  }

  /**
   * * Giao dịch hoa hồng
   * @param user_status
   * @param amount
   * @param note
   * @returns
   */
  async commission(user_status: UserStatus, amount: string, note?: string) {
    console.log('Cộng hoa hồng từ ', user_status.commission);

    user_status.commission = String(
      Number(user_status.commission) + Number(amount),
    );

    console.log('Sau khi cộng hoa hồng ', user_status.commission);

    this.create({
      user_status_id: user_status.id,
      amount,
      transaction_type: TransactionType.COMMISSION,
      description: note == null ? '' : note,
    });

    return this.userStatusRepository.save(user_status);
  }

  /**
   * * Giao dịch mua hàng
   * @param user_status
   * @param amount
   * @param note
   * @returns
   */
  async purchase(user_status: UserStatus, amount: string, note?: string) {
    console.log('Đã vào hàm puschase');
    user_status.total_purchase = String(
      Number(user_status.total_purchase) + Number(amount),
    );

    user_status.total_orders += 1;

    this.create({
      user_status_id: user_status.id,
      amount,
      transaction_type: TransactionType.PURCHASE,
      description: note,
    });

    return this.userStatusRepository.save(user_status); // * CHECKED
  }

  /**
   * Helper function to calculate bonus based on total sales
   * @param userStatus
   * @returns
   */
  private calculateBonus(userStatus: UserStatus) {
    // console.log('Calculating bonus for user:', userStatus);
    const total_sales = Number(userStatus.total_sales);
    const mind_stone = [5000000, 20000000, 50000000, 80000000, 100000000];
    const bonus_percentage = [0.03, 0.04, 0.05, 0.06, 0.1];

    for (let i = mind_stone.length; i >= 0; i--) {
      if (total_sales >= mind_stone[i]) {
        return total_sales * bonus_percentage[i];
      }
    }

    return 0;
  }

  /**
   * * Khi người dùng bán được hàng => cập nhật doanh thu và thưởng
   * @param current_user_status
   * @param amount
   * @param note
   * @returns
   */
  async sales(current_user_status: UserStatus, amount: string, note?: string) {
    current_user_status.total_sales = String(
      Number(current_user_status.total_sales) + Number(amount),
    );

    this.bonus(
      current_user_status,
      this.calculateBonus(current_user_status).toString(),
      'Thưởng nhận được từ doanh thu',
    );

    this.create({
      user_status_id: current_user_status.id,
      amount,
      transaction_type: TransactionType.SALE,
      description: 'Bán được hàng',
    });

    return this.userStatusRepository.save(current_user_status);
  }

  /**
   * * Reset tiền hàng tháng
   * @param user_status
   * @param time
   * @returns
   */
  async reset(user_status: UserStatus, time?: Date) {
    const currentMonth = time.getMonth() + 1;

    const lastMonth = currentMonth == 1 ? 12 : currentMonth - 1;

    this.create({
      user_status_id: user_status.id,
      amount: '-' + user_status.bonus,
      transaction_type: TransactionType.RESET,
      description: 'Thanh toán tiền thưởng tháng ' + lastMonth,
    });

    this.create({
      user_status_id: user_status.id,
      amount: '-' + user_status.commission,
      transaction_type: TransactionType.RESET,
      description: 'Thanh toán tiền hoa hồng tháng ' + lastMonth,
    });

    this.create({
      user_status_id: user_status.id,
      amount: '-' + user_status.total_sales,
      transaction_type: TransactionType.RESET,
      description: 'Làm mới tổng doanh thu cho tháng  ' + currentMonth,
    });

    user_status.bonus = '0';
    user_status.commission = '0';
    user_status.total_sales = '0';
    return this.userStatusRepository.save(user_status);
  }
}
