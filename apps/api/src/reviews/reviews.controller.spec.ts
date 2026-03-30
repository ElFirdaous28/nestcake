import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;

  const reviewsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findMyReviews: jest.fn(),
    findByProfessional: jest.fn(),
    findOne: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [{ provide: ReviewsService, useValue: reviewsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(ReviewsController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('create: should call service with user and dto', async () => {
    const req = {
      user: { sub: 'c1', email: 'client@test.com', role: UserRole.CLIENT },
    } as any;
    const dto = {
      orderId: '507f1f77bcf86cd799439701',
      rating: 5,
      comment: 'Great service',
    } as any;
    const created = { _id: 'rv1', rating: 5, comment: 'Great service' };

    reviewsServiceMock.create.mockResolvedValue(created);

    const result = await controller.create(req, dto);

    expect(reviewsServiceMock.create).toHaveBeenCalledWith(req.user, dto);
    expect(result).toEqual(created);
  });

  it('create: should throw when service rejects duplicate review', async () => {
    const req = {
      user: { sub: 'c2', email: 'client2@test.com', role: UserRole.CLIENT },
    } as any;
    const dto = { orderId: '507f1f77bcf86cd799439702', rating: 4 } as any;

    reviewsServiceMock.create.mockRejectedValue(
      new BadRequestException('You have already reviewed this order'),
    );

    await expect(controller.create(req, dto)).rejects.toThrow(BadRequestException);
    expect(reviewsServiceMock.create).toHaveBeenCalledWith(req.user, dto);
  });

  it('findAll: should call service with query', async () => {
    const query = { page: 1, limit: 20 } as any;
    const response = {
      data: [{ _id: 'rv1' }],
      summary: { averageRating: 5, totalReviews: 1 },
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    };

    reviewsServiceMock.findAll.mockResolvedValue(response);

    const result = await controller.findAll(query);

    expect(reviewsServiceMock.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(response);
  });

  it('findMyReviews: should call service with user and query', async () => {
    const req = {
      user: {
        sub: 'p1',
        email: 'pro@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const query = { page: 2, limit: 10 } as any;
    const response = {
      data: [{ _id: 'rv2' }],
      summary: { averageRating: 4.5, totalReviews: 2 },
      pagination: { page: 2, limit: 10, total: 2, pages: 1 },
    };

    reviewsServiceMock.findMyReviews.mockResolvedValue(response);

    const result = await controller.findMyReviews(req, query);

    expect(reviewsServiceMock.findMyReviews).toHaveBeenCalledWith(req.user, query);
    expect(result).toEqual(response);
  });

  it('findMyReviews: should throw when service rejects missing profile', async () => {
    const req = {
      user: {
        sub: 'p2',
        email: 'pro2@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const query = { page: 1, limit: 20 } as any;

    reviewsServiceMock.findMyReviews.mockRejectedValue(
      new NotFoundException('Professional profile not found'),
    );

    await expect(controller.findMyReviews(req, query)).rejects.toThrow(NotFoundException);
    expect(reviewsServiceMock.findMyReviews).toHaveBeenCalledWith(req.user, query);
  });

  it('findByProfessional: should call service with professional id and query', async () => {
    const professionalId = '507f1f77bcf86cd799439703';
    const query = { page: 1, limit: 5 } as any;
    const response = {
      data: [{ _id: 'rv3' }],
      summary: { averageRating: 4.2, totalReviews: 8 },
      pagination: { page: 1, limit: 5, total: 8, pages: 2 },
    };

    reviewsServiceMock.findByProfessional.mockResolvedValue(response);

    const result = await controller.findByProfessional(professionalId, query);

    expect(reviewsServiceMock.findByProfessional).toHaveBeenCalledWith(professionalId, query);
    expect(result).toEqual(response);
  });

  it('findOne: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439704';
    const review = { _id: id, rating: 5 };

    reviewsServiceMock.findOne.mockResolvedValue(review);

    const result = await controller.findOne(id);

    expect(reviewsServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(review);
  });

  it('findOne: should throw when service rejects not found', async () => {
    const id = '507f1f77bcf86cd799439799';

    reviewsServiceMock.findOne.mockRejectedValue(new NotFoundException('Review not found'));

    await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    expect(reviewsServiceMock.findOne).toHaveBeenCalledWith(id);
  });
});
