import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SocketGateway } from 'src/socket/socket.gateway';
import Order from 'src/orders/entities/order.entity';
import User from 'src/users/entities/user.entity';
import { Role } from 'src/enum/role';
import { Notification } from './entities/notification.entity';
import { OnEvent } from '@nestjs/event-emitter';

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
  async createOrderNotification(order: Order) {
    console.log('Order created event received');

    const admins = await this.userRepository.find({
      where: { role: Role.ADMIN },
    });

    for (const admin of admins) {
      try {
        const notification = this.notificationRepository.create({
          message: `New order from ${order.user.fullname}`,
          user: admin,
        });
        this.notificationRepository.save(notification);
      } catch (error) {
        throw new Error('Error creating notification');
      }
    }

    this.socketGateway.server.emit('newOrder', order);
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
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new Error('Error fetching notifications');
    }
  }
}
