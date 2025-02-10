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

  async getAnalysisForAllUsers(startDate: Date, endDate: Date) {
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
      .where('transaction.createdAt >= :startDate', { startDate })
      .andWhere('transaction.createdAt <= :endDate', { endDate })
      .groupBy("to_char(transaction.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const total = userTransactions.reduce(
      (acc, curr) => {
        acc.commission_amount = String(
          Number(acc.commission_amount) + Number(curr.commission_amount),
        );
        acc.bonus_amount = String(
          Number(acc.bonus_amount) + Number(curr.bonus_amount),
        );
        acc.purchase_amount = String(
          Number(acc.purchase_amount) + Number(curr.purchase_amount),
        );
        acc.sale_amount = String(
          Number(acc.sale_amount) + Number(curr.sale_amount),
        );
        acc.commission_count = String(
          Number(acc.commission_count) + Number(curr.commission_count),
        );
        acc.bonus_count = String(
          Number(acc.bonus_count) + Number(curr.bonus_count),
        );
        acc.purchase_count = String(
          Number(acc.purchase_count) + Number(curr.purchase_count),
        );
        acc.sale_count = String(
          Number(acc.sale_count) + Number(curr.sale_count),
        );
        return acc;
      },
      {
        commission_amount: 0,
        bonus_amount: 0,
        purchase_amount: 0,
        sale_amount: 0,
        commission_count: 0,
        bonus_count: 0,
        purchase_count: 0,
        sale_count: 0,
      },
    );

    return {
      userTransactions,
      period: {
        startDate,
        endDate,
      },
      total,
    };
  }
}
