import { Module } from '@nestjs/common';
import { UserStatusService } from './user-status.service';
import { UserStatusController } from './user-status.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStatus } from './entities/user-status.entity';
import { UsersModule } from 'src/users/users.module';
import User from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserStatus, User]), UsersModule, UserStatusModule],
  controllers: [UserStatusController],
  providers: [UserStatusService],
  exports: [UserStatusService]
})
export class UserStatusModule {}
