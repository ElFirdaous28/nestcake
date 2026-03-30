import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Req,
  Query,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationDocument } from './schemas/notification.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiQuery({ name: 'limit', required: false, example: '50' })
  @ApiQuery({ name: 'skip', required: false, example: '0' })
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

  @ApiOperation({ summary: 'Get unread notification count' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: any): Promise<number> {
    const userId = req.user?.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Put(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
  ): Promise<NotificationDocument> {
    return this.notificationsService.markAsRead(notificationId);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Put('read-all')
  async markAllAsRead(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Delete(':id')
  async deleteNotification(
    @Param('id') notificationId: string,
  ): Promise<NotificationDocument> {
    return this.notificationsService.deleteNotification(notificationId);
  }

  @ApiOperation({ summary: 'Delete all notifications for current user' })
  @Delete()
  async deleteAllNotifications(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationsService.deleteAllUserNotifications(userId);
  }
}
