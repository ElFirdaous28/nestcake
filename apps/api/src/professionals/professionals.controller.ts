import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthUser, UserRole } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { multerDiskConfig } from '../common/upload.config';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ProfessionalsService } from './professionals.service';
import { UpdateMyProfessionalDto } from './dto/update-my-professional.dto';
import { AddProfessionalPortfolioItemDto } from './dto/add-professional-portfolio-item.dto';
import { UpdateProfessionalVerificationDto } from './dto/update-professional-verification.dto';

@UseGuards(JwtAuthGuard)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) { }

  @Get()
  findAll() {
    return this.professionalsService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('me')
  getMe(@Req() req: Request & { user: AuthUser }) {
    return this.professionalsService.getMe(req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch('me')
  updateMe(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateMyProfessionalDto,
  ) {
    return this.professionalsService.updateMe(req.user, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch('me/portfolio')
  @UseInterceptors(FileInterceptor('image', multerDiskConfig('portfolio')))
  addPortfolioItem(
    @Req() req: Request & { user: AuthUser },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: AddProfessionalPortfolioItemDto,
  ) {
    return this.professionalsService.addPortfolioItem(req.user, file, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Delete('me/portfolio/:id')
  removePortfolioItem(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) portfolioItemId: string,
  ) {
    return this.professionalsService.removePortfolioItem(req.user, portfolioItemId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/verification')
  updateVerification(
    @Param('id', ParseObjectIdPipe) professionalId: string,
    @Body() dto: UpdateProfessionalVerificationDto,
  ) {
    return this.professionalsService.updateVerification(professionalId, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.professionalsService.findOne(id);
  }
}
