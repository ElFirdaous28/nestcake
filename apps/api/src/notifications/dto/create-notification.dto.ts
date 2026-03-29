import { IsEnum, IsNotEmpty, IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { NotificationType } from '@shared-types';
import { Types } from 'mongoose';

export class CreateNotificationDto {
  @IsNotEmpty()
  userId: Types.ObjectId;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  read?: boolean;
}

export class MarkAsReadDto {
  @IsNotEmpty()
  notificationId: string;
}
