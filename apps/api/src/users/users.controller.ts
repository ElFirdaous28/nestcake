import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthUser } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('')
  getMe(@Req() req: Request & { user: AuthUser }) {
    return this.usersService.getMe(req.user);
  }

  @Patch('')
  updateMe(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMe(req.user, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user, dto);
  }

  @Delete('')
  @HttpCode(HttpStatus.OK)
  async deleteMe(
    @Req() req: Request & { user: AuthUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.deleteMe(req.user);
    this.clearAuthCookie(res);
    return result;
  }

  private clearAuthCookie(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
