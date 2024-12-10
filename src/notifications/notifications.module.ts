import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { UsersModule } from 'src/users/users.module';
import User from 'src/users/entities/user.entity';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    UsersModule,
    SocketModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
