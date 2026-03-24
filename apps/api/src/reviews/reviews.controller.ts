import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthUser, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user, createReviewDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: FindReviewsQueryDto): Promise<{ data: (import("c:/Projects/nestcake/apps/api/src/reviews/entities/review.entity").Review & { _id: import("mongoose").Types.ObjectId; } & { __v: number; })[]; summary: { averageRating: any; totalReviews: any; }; pagination: { page: number; limit: number; total: number; pages: number; }; }> {
    return this.reviewsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('my-reviews')
  findMyReviews(
    @Req() req: Request & { user: AuthUser },
    @Query() query: FindReviewsQueryDto,
  ) {
    return this.reviewsService.findMyReviews(req.user, query);
  }

  @Get('professional/:professionalId')
  findByProfessional(
    @Param('professionalId', ParseObjectIdPipe) professionalId: string,
    @Query() query: FindReviewsQueryDto,
  ) {
    return this.reviewsService.findByProfessional(professionalId, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.reviewsService.findOne(id);
  }
}
