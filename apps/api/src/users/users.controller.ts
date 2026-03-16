import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AuthUser } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerDiskConfig } from '../common/upload.config';
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

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('avatar', multerDiskConfig('avatars')))
  uploadAvatar(
    @Req() req: Request & { user: AuthUser },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(req.user, file);
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
