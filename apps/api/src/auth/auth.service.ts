import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@shared-types';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../users/schemas/user.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterProfessionalDto } from './dto/register-professional.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from '@shared-types';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Professional.name)
    private readonly professionalModel: Model<Professional>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(dto: RegisterUserDto) {
    const user = await this.createUser(dto, UserRole.CLIENT);
    return this.buildAuthResponse(user._id.toString(), user.email, user.role);
  }

  async registerProfessional(dto: RegisterProfessionalDto) {
    const user = await this.createUser(dto, UserRole.PROFESSIONAL);

    await this.professionalModel.create({
      userId: user._id,
      businessName: dto.businessName,
      description: dto.description,
      location: dto.location,
    });

    return this.buildAuthResponse(user._id.toString(), user.email, user.role);
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user._id.toString(), user.email, user.role);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.refreshTokenModel.findOne({ tokenHash }).exec();

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await stored.deleteOne();
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(stored.userId).exec();
    if (!user) {
      await stored.deleteOne();
      throw new UnauthorizedException('User not found');
    }

    // delete old token
    await stored.deleteOne();
    return this.buildAuthResponse(user._id.toString(), user.email, user.role);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenModel.deleteOne({ tokenHash }).exec();
  }

  async revokeAllForUser(userId: string) {
    await this.refreshTokenModel.deleteMany({ userId }).exec();
  }

  async getMe(authUser: AuthUser) {
    const user = await this.userModel
      .findById(authUser.sub)
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async createUser(
    dto: RegisterUserDto | RegisterProfessionalDto,
    role: UserRole,
  ) {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.userModel.findOne({ email }).lean().exec();
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.userModel.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      password: hashedPassword,
      phone: dto.phone,
      role,
    });
  }

  private async buildAuthResponse(sub: string, email: string, role: UserRole) {
    const payload: AuthUser = { sub, email, role };
    const accessToken = await this.jwtService.signAsync(payload);

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.refreshTokenModel.create({ userId: sub, tokenHash, expiresAt });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: payload,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string | undefined) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required');
    }

    return email.trim().toLowerCase();
  }
}
