import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationDocument } from './schemas/notification.schema';
import { Types } from 'mongoose';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    console.log('WebSocket initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
      client.join(`user-${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId && this.userSockets.has(userId)) {
      const userSocketIds = this.userSockets.get(userId);
      userSocketIds.delete(client.id);

      if (userSocketIds.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('notification:test')
  handleTestNotification(client: Socket, data: any) {
    const userId = client.handshake.query.userId as string;
    console.log(`📨 Test notification from ${userId}:`, data);
    this.server.to(`user-${userId}`).emit('notification', data);
  }

  // Send notification to a specific user
  async sendNotificationToUser(
    userId: string | Types.ObjectId,
    notification: NotificationDocument,
  ) {
    const userIdStr = userId.toString();
    console.log(
      `📨 Sending notification to user ${userIdStr}:`,
      notification.type,
    );
    this.server.to(`user-${userIdStr}`).emit('notification', {
      _id: notification._id?.toString() || notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: notification.read ?? false,
    });
  }

  // Send notification to multiple users
  async sendNotificationToUsers(
    userIds: (string | Types.ObjectId)[],
    notification: Partial<NotificationDocument>,
  ) {
    userIds.forEach((userId) => {
      const userIdStr = userId.toString();
      this.server.to(`user-${userIdStr}`).emit('notification', {
        _id: notification._id?.toString() || notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        read: notification.read ?? false,
      });
    });
  }

  // Broadcast unread count update
  async updateUnreadCount(userId: string | Types.ObjectId) {
    const userIdStr = userId.toString();
    const unreadCount =
      await this.notificationsService.getUnreadCount(userIdStr);
    this.server
      .to(`user-${userIdStr}`)
      .emit('notification:unread-count', { count: unreadCount });
  }

  // Mark notification as read (real-time)
  async notifyRead(userId: string | Types.ObjectId, notificationId: string) {
    const userIdStr = userId.toString();
    this.server
      .to(`user-${userIdStr}`)
      .emit('notification:read', { notificationId });
  }
}
