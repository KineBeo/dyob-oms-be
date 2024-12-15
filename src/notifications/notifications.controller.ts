import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('notifications')
@ApiTags('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all notifications' })
  @UseGuards(JwtAuthGuard)
  @Get('')
  async findAllNotifications(@Req() req) {
    const user_id = req.user.sub;
    return this.notificationsService.findAllNotifications(+user_id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark notification as read' })
  @UseGuards(JwtAuthGuard)
  @Patch('read/:notification_id')
  async markAsRead(@Param('notification_id') notification_id: string) {
    return this.notificationsService.markAsRead(+notification_id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete notification' })
  @UseGuards(JwtAuthGuard)
  @Delete(':notification_id')
  async deleteNotification(
    @Req() req,
    @Param('notification_id') notification_id: string,
  ) {
    const user_id = req.user.sub;

    if (notification_id === 'all') {
      return this.notificationsService.deleteAllNotifications(+user_id);
    }

    return this.notificationsService.deleteNotifications(
      +notification_id,
      +user_id,
    );
  }
}
