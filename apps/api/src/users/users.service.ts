import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { unlinkSync } from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { AuthUser } from '@shared-types';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly authService: AuthService,
  ) {}

  async getMe(authUser: AuthUser) {
    const user = await this.userModel.findById(authUser.sub).select('-password').lean().exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(authUser: AuthUser, dto: UpdateProfileDto) {
    const updateData = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));

    const user = await this.userModel
      .findByIdAndUpdate(authUser.sub, updateData, {
        returnDocument: 'after',
        runValidators: true,
      })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async uploadAvatar(authUser: AuthUser, file: Express.Multer.File) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    const user = await this.userModel
      .findByIdAndUpdate(
        authUser.sub,
        { avatar: avatarUrl },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      unlinkSync(file.path);
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changePassword(authUser: AuthUser, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(authUser.sub).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPasswordOk = await bcrypt.compare(dto.currentPassword, user.password);
    if (!currentPasswordOk) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const samePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (samePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    // Revoke all sessions — forces re-login on all devices
    await this.authService.revokeAllForUser(authUser.sub);

    return { message: 'Password changed successfully' };
  }

  async deleteMe(authUser: AuthUser) {
    const deleted = await this.userModel.findByIdAndDelete(authUser.sub).lean().exec();

    if (!deleted) {
      throw new NotFoundException('User not found');
    }

    // Clean up all refresh tokens for this user
    await this.authService.revokeAllForUser(authUser.sub);

    return { message: 'Account deleted successfully' };
  }

  async findAllForAdmin(
    authUser: AuthUser,
    filters?: {
      search?: string;
      role?: string;
      skip?: number;
      limit?: number;
    },
  ) {
    const { search = '', role, skip = 0, limit = 50 } = filters || {};
    // exept the current login admin user
    const query: any = { _id: { $ne: authUser.sub } };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await this.userModel
      .find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean()
      .exec();

    const total = await this.userModel.countDocuments(query);

    return {
      data: users,
      pagination: {
        skip: Number(skip),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
