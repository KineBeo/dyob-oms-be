import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from 'src/users/entities/user.entity';
import { UserStatus } from 'src/user-status/entities/user-status.entity';
import { UserTransaction } from 'src/user-transactions/entities/user-transaction.entity';
import Order from 'src/orders/entities/order.entity';
import { UsersModule } from 'src/users/users.module';
import { UserStatusModule } from 'src/user-status/user-status.module';
import { UserTransactionsModule } from 'src/user-transactions/user-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserStatus, UserTransaction, Order]),
    UsersModule,
    UserStatusModule,
    UserTransactionsModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
