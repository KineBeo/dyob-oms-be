import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SocketGateway } from 'src/socket/socket.gateway';
import Order from 'src/orders/entities/order.entity';
import User from 'src/users/entities/user.entity';
import { Role } from 'src/enum/role';
import { Notification } from './entities/notification.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
    private socketGateway: SocketGateway,
  ) {}

  @OnEvent('order.created')
  async createOrderNotificationForAdmin(order: Order) {
    console.log('Order created event received');

    const admins = await this.userRepository.find({
      where: { role: Role.ADMIN },
    });

    for (const admin of admins) {
      try {
        const notification = this.notificationRepository.create({
          message: `Bạn có đơn hàng mới giá trị ${order.total_amount}đ`,
          user: admin,
        });
        this.notificationRepository.save(notification);
      } catch (error) {
        throw new Error('Error creating notification');
      }
    }

    this.socketGateway.server.emit('newOrder', order);
  }

  @OnEvent('order.completed')
  async createOrderCompletedNotification(payload: {
    userId: number;
    orderAmount: string;
  }) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const notification = this.notificationRepository.create({
        message: `Đơn hàng của bạn đã hoàn thành`,
        user: user,
      });
      this.notificationRepository.save(notification);
    } catch (error) {
      throw new Error('Error creating notification');
    }

    this.socketGateway.server.emit('orderCompleted', payload);
  }

  async findAllNotifications(user_id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.notificationRepository.find({
        where: { user },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    } catch (error) {
      throw error('Error fetching notifications');
    }
  }

  async markAsRead(notification_id: number) {
    try {
      await this.notificationRepository.update(notification_id, {
        is_read: true,
      });
      return 'Notification marked as read';
    } catch (error) {
      throw error('Error marking notification as read');
    }
  }

  async deleteNotifications(notification_id: number, user_id: number) {
    const user = this.userRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = await this.notificationRepository.findOne({
      where: { id: notification_id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user.id !== user_id) {
      throw new ForbiddenException(
        'You are not allowed to delete this notification',
      );
    }

    try {
      await this.notificationRepository.delete(notification_id);
      return 'Notification deleted';
    } catch (error) {
      throw error('Error deleting notification');
    }
  }

  async deleteAllNotifications(user_id: number) {
    const user = this.userRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.notificationRepository.delete({
        user: { id: user_id },
      });
      return 'All notifications deleted';
    } catch (error) {
      throw error('Error deleting notifications');
    }
  }

  //Viết hàm sử dụng cronjob để xóa tất cả thông báo sau 90 ngày
  @Cron('0 0 * * *')
  async deleteOldNotifications() {
    const ninetyDaysAgo = new Date(
      new Date().getTime() - 90 * 24 * 60 * 60 * 1000,
    );

    try {
      await this.notificationRepository.delete({
        createdAt: new Date(ninetyDaysAgo),
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error deleting old notifications',
      );
    }
  }
}
