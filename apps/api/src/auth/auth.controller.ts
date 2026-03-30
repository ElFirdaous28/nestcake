import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterProfessionalDto } from './dto/register-professional.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from '@shared-types';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a client user account' })
  @ApiBody({
    type: RegisterUserDto,
    examples: {
      default: {
        value: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          phone: '+15551234567',
        },
      },
    },
  })
  @Post('register/user')
  async registerUser(@Body() dto: RegisterUserDto, @Res({ passthrough: true }) res: Response) {
    const auth = await this.authService.registerUser(dto);
    this.setTokenCookies(res, auth.accessToken, auth.refreshToken);
    return { accessToken: auth.accessToken, user: auth.user };
  }

  @ApiOperation({ summary: 'Register a professional account' })
  @ApiBody({
    type: RegisterProfessionalDto,
    examples: {
      default: {
        value: {
          firstName: 'Alex',
          lastName: 'Baker',
          email: 'alex@example.com',
          password: 'secret123',
          phone: '+15551234567',
          businessName: 'Alex Cakes',
          description: 'Custom birthday cakes and desserts',
          location: {
            type: 'Point',
            coordinates: [-73.935242, 40.73061],
          },
        },
      },
    },
  })
  @Post('register/professional')
  async registerProfessional(
    @Body() dto: RegisterProfessionalDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const auth = await this.authService.registerProfessional(dto);
    this.setTokenCookies(res, auth.accessToken, auth.refreshToken);
    return { accessToken: auth.accessToken, user: auth.user };
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    type: LoginDto,
    examples: {
      default: {
        value: {
          email: 'jane@example.com',
          password: 'secret123',
        },
      },
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const auth = await this.authService.login(dto);
    this.setTokenCookies(res, auth.accessToken, auth.refreshToken);
    return { accessToken: auth.accessToken, user: auth.user };
  }

  @ApiOperation({ summary: 'Refresh access token from refresh cookie' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const auth = await this.authService.refresh(rawRefreshToken);
    this.setTokenCookies(res, auth.accessToken, auth.refreshToken);
    return { accessToken: auth.accessToken, user: auth.user };
  }

  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.cookies?.refresh_token);
    this.clearTokenCookies(res);
    return { message: 'Logged out' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request & { user: AuthUser }) {
    return this.authService.getMe(req.user);
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: ACCESS_COOKIE_MAX_AGE,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/api/auth',
    });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
  }
}
