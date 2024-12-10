import { forwardRef, Module } from '@nestjs/common';
import { CommissionHistoryService } from './commission-history.service';
import { CommissionHistoryController } from './commission-history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionHistory } from './entities/commission-history.entity';
import { UserStatusModule } from 'src/user-status/user-status.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionHistory]), UserStatusModule, UsersModule],
  controllers: [CommissionHistoryController],
  providers: [CommissionHistoryService],
  exports: [CommissionHistoryService],
})
export class CommissionHistoryModule {}
