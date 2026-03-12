import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterProfessionalDto } from './dto/register-professional.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser } from '@shared-types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/user')
  async registerUser(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const auth = await this.authService.registerUser(dto);
    this.setAuthCookie(res, auth.accessToken);
    return auth;
  }

  @Post('register/professional')
  async registerProfessional(
    @Body() dto: RegisterProfessionalDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const auth = await this.authService.registerProfessional(dto);
    this.setAuthCookie(res, auth.accessToken);
    return auth;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const auth = await this.authService.login(dto);
    this.setAuthCookie(res, auth.accessToken);
    return auth;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request & { user: AuthUser }) {
    return this.authService.getMe(req.user);
  }

  private setAuthCookie(res: Response, token: string) {
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.JWT_COOKIE_MAX_AGE_MS ?? 1000 * 60 * 60 * 24 * 7),
      path: '/',
    });
  }
}
