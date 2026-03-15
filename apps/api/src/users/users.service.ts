import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
    const user = await this.userModel
      .findById(authUser.sub)
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(authUser: AuthUser, dto: UpdateProfileDto) {
    const updateData: Partial<User> = {};

    if (typeof dto.firstName === 'string') {
      updateData.firstName = dto.firstName;
    }

    if (typeof dto.lastName === 'string') {
      updateData.lastName = dto.lastName;
    }

    if (typeof dto.phone === 'string') {
      updateData.phone = dto.phone;
    }

    if (typeof dto.avatar === 'string') {
      updateData.avatar = dto.avatar;
    }

    const user = await this.userModel
      .findByIdAndUpdate(authUser.sub, updateData, { new: true, runValidators: true })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
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
}
