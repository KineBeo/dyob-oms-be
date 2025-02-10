import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus } from 'src/user-status/entities/user-status.entity';
import { UserTransaction } from 'src/user-transactions/entities/user-transaction.entity';
import User from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(UserTransaction)
    private userTransactionRepository: Repository<UserTransaction>,

    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAnalysisForUser(month: number, year: number, user: number) {
    const userTransactions = await this.userTransactionRepository
      .createQueryBuilder('transaction')
      .select("to_char(transaction.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect(
        `SUM(CASE WHEN transaction.type = 'COMMISSION' THEN CAST(transaction.amount as DECIMAL) ELSE 0 END)`,
        'commission_amount',
      )
      .addSelect(
        `SUM(CASE WHEN transaction.type = 'BONUS' THEN CAST(transaction.amount as DECIMAL) ELSE 0 END)`,
        'bonus_amount',
      )
      .addSelect(
        `SUM(CASE WHEN transaction.type = 'PURCHASE' THEN CAST(transaction.amount as DECIMAL) ELSE 0 END)`,
        'purchase_amount',
      )
      .addSelect(
        `SUM(CASE WHEN transaction.type = 'SALE' THEN CAST(transaction.amount as DECIMAL) ELSE 0 END)`,
        'sale_amount',
      )
      .addSelect(
        `COUNT(CASE WHEN transaction.type = 'COMMISSION' THEN 1 END)`,
        'commission_count',
      )
      .addSelect(
        `COUNT(CASE WHEN transaction.type = 'BONUS' THEN 1 END)`,
        'bonus_count',
      )
      .addSelect(
        `COUNT(CASE WHEN transaction.type = 'PURCHASE' THEN 1 END)`,
        'purchase_count',
      )
      .addSelect(
        `COUNT(CASE WHEN transaction.type = 'SALE' THEN 1 END)`,
        'sale_count',
      )
      .leftJoin('transaction.userStatus', 'userStatus')
      .leftJoin('userStatus.user', 'user')
      .where('user.id = :userId', { userId: user })
      .andWhere('EXTRACT(MONTH FROM transaction.createdAt) = :month', { month })
      .andWhere('EXTRACT(YEAR FROM transaction.createdAt) = :year', { year })
      .groupBy("to_char(transaction.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      userTransactions,
      period: {
        month,
        year,
      },
    };
  }
}
