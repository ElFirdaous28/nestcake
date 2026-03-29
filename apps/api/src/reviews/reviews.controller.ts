import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthUser, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create review (client only)' })
  @ApiBody({
    type: CreateReviewDto,
    examples: {
      default: {
        value: {
          orderId: '65f0c7e8f9697f3c69312345',
          rating: 5,
          comment: 'Amazing quality and on-time delivery.',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user, createReviewDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all reviews (admin)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: FindReviewsQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my reviews (professional)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('my-reviews')
  findMyReviews(
    @Req() req: Request & { user: AuthUser },
    @Query() query: FindReviewsQueryDto,
  ) {
    return this.reviewsService.findMyReviews(req.user, query);
  }

  @ApiOperation({ summary: 'List reviews for a professional' })
  @ApiParam({
    name: 'professionalId',
    example: '65f0c7e8f9697f3c69312345',
  })
  @Get('professional/:professionalId')
  findByProfessional(
    @Param('professionalId', ParseObjectIdPipe) professionalId: string,
    @Query() query: FindReviewsQueryDto,
  ) {
    return this.reviewsService.findByProfessional(professionalId, query);
  }

  @ApiOperation({ summary: 'Get review by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.reviewsService.findOne(id);
  }
}
