import { Module } from '@nestjs/common';
import { UserTransactionsService } from './user-transactions.service';
import { UserTransactionsController } from './user-transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTransaction } from './entities/user-transaction.entity';
import { UsersModule } from 'src/users/users.module';
import { UserStatusModule } from 'src/user-status/user-status.module';
import { UserStatus } from 'src/user-status/entities/user-status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTransaction, UserStatus]),
    UsersModule,
    UserStatus,
  ],
  controllers: [UserTransactionsController],
  providers: [UserTransactionsService],
  exports: [UserTransactionsService],
})
export class UserTransactionsModule {}
