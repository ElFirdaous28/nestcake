import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationType } from '@shared-types';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = new this.notificationModel(createNotificationDto);
    return notification.save();
  }

  private buildUserIdFilter(userId: string | Types.ObjectId) {
    const userIdStr = userId.toString();

    if (Types.ObjectId.isValid(userIdStr)) {
      return {
        $or: [
          { userId: new Types.ObjectId(userIdStr) },
          { userId: userIdStr },
        ],
      };
    }

    return { userId: userIdStr };
  }

  async getUserNotifications(userId: string | Types.ObjectId, limit: number = 50, skip: number = 0) {
    const userFilter = this.buildUserIdFilter(userId);
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50;
    const safeSkip = Number.isFinite(skip) ? Math.max(skip, 0) : 0;

    const notifications = await this.notificationModel
      .find(userFilter)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip(safeSkip)
      .lean();

    const total = await this.notificationModel.countDocuments(userFilter);
    const unread = await this.notificationModel.countDocuments({ ...userFilter, read: false });

    return { notifications, total, unread };
  }

  async markAsRead(notificationId: string | Types.ObjectId): Promise<NotificationDocument> {
    return this.notificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string | Types.ObjectId): Promise<any> {
    const userFilter = this.buildUserIdFilter(userId);
    return this.notificationModel.updateMany({ ...userFilter, read: false }, { read: true });
  }

  async deleteNotification(notificationId: string | Types.ObjectId): Promise<NotificationDocument> {
    return this.notificationModel.findByIdAndDelete(notificationId);
  }

  async deleteAllUserNotifications(userId: string | Types.ObjectId): Promise<any> {
    return this.notificationModel.deleteMany(this.buildUserIdFilter(userId));
  }

  async getUnreadCount(userId: string | Types.ObjectId): Promise<number> {
    return this.notificationModel.countDocuments({
      ...this.buildUserIdFilter(userId),
      read: false,
    });
  }

  async createOrderNotification(
    userId: Types.ObjectId,
    type: NotificationType,
    orderId: Types.ObjectId,
    title: string,
    message: string,
  ): Promise<NotificationDocument> {
    return this.create({
      userId,
      type,
      title,
      message,
      data: { orderId: orderId.toString() },
    });
  }

  async createProposalNotification(
    userId: Types.ObjectId,
    type: NotificationType,
    proposalId: Types.ObjectId,
    professionalName: string,
    title: string,
  ): Promise<NotificationDocument> {
    return this.create({
      userId,
      type,
      title,
      message: `${professionalName} replied to your request`,
      data: { proposalId: proposalId.toString(), professionalName },
    });
  }

  async createPaymentNotification(
    userId: Types.ObjectId,
    orderId: Types.ObjectId,
    amount: number,
  ): Promise<NotificationDocument> {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_CONFIRMATION,
      title: 'Payment Confirmation',
      message: `Payment of $${amount.toFixed(2)} has been confirmed`,
      data: { orderId: orderId.toString(), amount },
    });
  }
}
