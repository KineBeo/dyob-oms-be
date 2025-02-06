import { Module } from '@nestjs/common';
import { UserTransactionsService } from './user-transactions.service';
import { UserTransactionsController } from './user-transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTransaction } from './entities/user-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTransaction])],
  controllers: [UserTransactionsController],
  providers: [UserTransactionsService],
  exports: [UserTransactionsService],
})
export class UserTransactionsModule {}
