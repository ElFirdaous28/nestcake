import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthUser, OrderStatus, OrderType, ProductStatus } from '@shared-types';
import { Model, Types } from 'mongoose';
import { Product } from '../products/schemas/product.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Professional.name) private readonly professionalModel: Model<Professional>,
  ) {}

  private listBaseQuery() {
    return this.orderModel
      .find()
      .populate('clientId', 'firstName lastName email phone avatar')
      .populate('professionalId', 'businessName verified verificationStatus')
      .populate('items.productId', 'name price isAvailable status');
  }

  async create(authUser: AuthUser, createOrderDto: CreateOrderDto) {
    const productIds = createOrderDto.items.map((item) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length !== productIds.length) {
      throw new BadRequestException('Duplicate products are not allowed in one order');
    }

    const products = await this.productModel
      .find({
        _id: { $in: uniqueProductIds.map((id) => new Types.ObjectId(id)) },
        isAvailable: true,
        status: ProductStatus.PUBLISHED,
      })
      .lean()
      .exec();

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException('One or more products are unavailable or unpublished');
    }

    const professionalIds = [...new Set(products.map((product) => product.professionalId.toString()))];

    if (professionalIds.length !== 1) {
      throw new BadRequestException('All order items must belong to the same professional');
    }

    const professionalId = professionalIds[0];

    const productById = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = createOrderDto.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) {
        throw new BadRequestException('Invalid product in order items');
      }

      return {
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const totalPrice = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const order = await this.orderModel.create({
      clientId: new Types.ObjectId(authUser.sub),
      professionalId: new Types.ObjectId(professionalId),
      type: OrderType.DIRECT,
      status: OrderStatus.AWAITING_PAYMENT,
      totalPrice,
      items: orderItems,
    });

    return this.findOne(order._id.toString());
  }

  findAll() {
    return `This action returns all orders`;
  }

  async findClientOrders(authUser: AuthUser, query: FindOrdersQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      clientId: new Types.ObjectId(authUser.sub),
    };

    if (query.status) {
      filter.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.listBaseQuery()
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findProfessionalOrders(authUser: AuthUser, query: FindOrdersQueryDto) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      professionalId: professional._id,
    };

    if (query.status) {
      filter.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.listBaseQuery()
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string) {
    return this.orderModel
      .findById(id)
      .populate('clientId', 'firstName lastName email phone avatar')
      .populate('professionalId', 'businessName verified verificationStatus')
      .populate('items.productId', 'name price isAvailable status')
      .lean()
      .exec();
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
