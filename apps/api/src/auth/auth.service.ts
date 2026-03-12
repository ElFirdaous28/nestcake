import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@shared-types';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/schemas/user.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterProfessionalDto } from './dto/register-professional.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from '@shared-types';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(Professional.name) private readonly professionalModel: Model<Professional>,
        private readonly jwtService: JwtService,
    ) { }

    async registerUser(dto: RegisterUserDto) {
        const user = await this.createUser(dto, UserRole.CLIENT);
        return this.buildAuthResponse(user._id.toString(), user.email, user.role);
    }

    async registerProfessional(dto: RegisterProfessionalDto) {
        const user = await this.createUser(dto, UserRole.PROFESSIONAL);

        await this.professionalModel.create({
            userId: user._id as Types.ObjectId,
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

        return {
            accessToken,
            user: payload,
        };
    }

    private normalizeEmail(email: string | undefined) {
        if (!email || typeof email !== 'string') {
            throw new BadRequestException('Email is required');
        }

        return email.trim().toLowerCase();
    }
}
