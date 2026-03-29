import { Controller, Get, Post, Put, Delete, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationDocument } from './schemas/notification.schema';
import { MarkAsReadDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('limit') limit: string = '50',
    @Query('skip') skip: string = '0',
  ) {
    const userId = req.user?.sub;
    return this.notificationsService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(skip),
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any): Promise<number> {
    const userId = req.user?.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') notificationId: string): Promise<NotificationDocument> {
    return this.notificationsService.markAsRead(notificationId);
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') notificationId: string): Promise<NotificationDocument> {
    return this.notificationsService.deleteNotification(notificationId);
  }

  @Delete()
  async deleteAllNotifications(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationsService.deleteAllUserNotifications(userId);
  }
}
