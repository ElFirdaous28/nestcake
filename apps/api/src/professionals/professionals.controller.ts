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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @ApiOperation({ summary: 'List professionals' })
  @Get()
  findAll() {
    return this.professionalsService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my professional profile' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('me')
  getMe(@Req() req: Request & { user: AuthUser }) {
    return this.professionalsService.getMe(req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my professional profile' })
  @ApiBody({
    type: UpdateMyProfessionalDto,
    examples: {
      default: {
        value: {
          businessName: 'Dream Cakes Studio',
          description: 'Artisan cakes for weddings and birthdays.',
          address: '123 Main St, New York, NY',
          location: {
            type: 'Point',
            coordinates: [-73.935242, 40.73061],
          },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch('me')
  updateMe(@Req() req: Request & { user: AuthUser }, @Body() dto: UpdateMyProfessionalDto) {
    return this.professionalsService.updateMe(req.user, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add portfolio item with image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        title: { type: 'string', example: 'Wedding Cake - June 2026' },
        description: {
          type: 'string',
          example: 'Three-tier floral wedding cake with fondant details.',
        },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch('me/portfolio')
  @UseInterceptors(FileInterceptor('image', multerDiskConfig('portfolio')))
  addPortfolioItem(
    @Req() req: Request & { user: AuthUser },
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: AddProfessionalPortfolioItemDto,
  ) {
    return this.professionalsService.addPortfolioItem(req.user, file, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove portfolio item' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Delete('me/portfolio/:id')
  removePortfolioItem(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) portfolioItemId: string,
  ) {
    return this.professionalsService.removePortfolioItem(req.user, portfolioItemId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update professional verification (admin)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    type: UpdateProfessionalVerificationDto,
    examples: {
      approved: { value: { verificationStatus: 'APPROVED' } },
      rejected: { value: { verificationStatus: 'REJECTED' } },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/verification')
  updateVerification(
    @Param('id', ParseObjectIdPipe) professionalId: string,
    @Body() dto: UpdateProfessionalVerificationDto,
  ) {
    return this.professionalsService.updateVerification(professionalId, dto);
  }

  @ApiOperation({ summary: 'Get professional by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.professionalsService.findOne(id);
  }
}
