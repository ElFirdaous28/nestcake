import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthUser, OrderStatus } from '@shared-types';
import { Model, Types } from 'mongoose';
import { Order } from '../orders/schemas/order.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews-query.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Professional.name) private readonly professionalModel: Model<Professional>,
  ) {}

  private async listByFilter(filter: Record<string, unknown>, query: FindReviewsQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const [data, total, summary] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('clientId', 'firstName lastName avatar')
        .populate('professionalId', 'businessName')
        .populate('orderId', 'status totalPrice type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments(filter),
      this.reviewModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      data,
      summary: {
        averageRating: summary[0]?.avgRating ?? 0,
        totalReviews: summary[0]?.totalReviews ?? 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async create(authUser: AuthUser, createReviewDto: CreateReviewDto) {
    const order = await this.orderModel
      .findById(createReviewDto.orderId)
      .lean()
      .exec();

    if (!order || order.isDeleted) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId.toString() !== authUser.sub) {
      throw new ForbiddenException('You can only review your own completed orders');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Review is only allowed after order completion');
    }

    const existing = await this.reviewModel
      .findOne({ orderId: order._id })
      .lean()
      .exec();

    if (existing) {
      throw new BadRequestException('You have already reviewed this order');
    }

    const review = await this.reviewModel.create({
      clientId: order.clientId,
      professionalId: order.professionalId,
      orderId: order._id,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment?.trim() || undefined,
    });

    return this.findOne(review._id.toString());
  }

  findAll(query: FindReviewsQueryDto) {
    return this.listByFilter({}, query);
  }

  findOne(id: string) {
    return this.reviewModel
      .findById(id)
      .populate('clientId', 'firstName lastName avatar')
      .populate('professionalId', 'businessName')
      .populate('orderId', 'status totalPrice type')
      .lean()
      .exec();
  }

  async findMyReviews(authUser: AuthUser, query: FindReviewsQueryDto) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    return this.listByFilter({ professionalId: professional._id }, query);
  }

  findByProfessional(professionalId: string, query: FindReviewsQueryDto) {
    return this.listByFilter({ professionalId: new Types.ObjectId(professionalId) }, query);
  }
}
