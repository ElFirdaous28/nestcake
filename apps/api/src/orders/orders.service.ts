import {
  BadRequestException,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AuthUser,
  OrderStatus,
  OrderType,
  ProductStatus,
  RequestStatus,
  UserRole,
  NotificationType,
} from '@shared-types';
import { Model, Types } from 'mongoose';
import { Product } from '../products/schemas/product.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { Request } from '../requests/schemas/request.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { Order } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Professional.name)
    private readonly professionalModel: Model<Professional>,
    @InjectModel(Request.name) private readonly requestModel: Model<Request>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private listBaseQuery() {
    return this.orderModel
      .find()
      .populate('clientId', 'firstName lastName email phone avatar')
      .populate('professionalId', 'businessName verified verificationStatus')
      .populate('items.productId', 'name price isAvailable status');
  }

  private async findActiveOrderOrThrow(id: string) {
    const order = await this.orderModel.findById(id).lean().exec();

    if (!order || order.isDeleted) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private ensureClientOwnsOrder(orderClientId: Types.ObjectId, authUser: AuthUser, action: string) {
    if (orderClientId.toString() !== authUser.sub) {
      throw new BadRequestException(`You can only ${action} your own orders`);
    }
  }

  private async getProfessionalForUserOrThrow(authUser: AuthUser) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    return professional;
  }

  private async setOrderStatus(id: string, status: OrderStatus) {
    await this.orderModel.findByIdAndUpdate(id, { status }, { runValidators: true });
  }

  private async listOrdersByFilter(filter: Record<string, unknown>, query: FindOrdersQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const finalFilter: Record<string, unknown> = {
      isDeleted: { $ne: true },
      ...filter,
    };
    if (query.status) {
      finalFilter.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.listBaseQuery()
        .find(finalFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(finalFilter),
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

    const professionalIds = [
      ...new Set(products.map((product) => product.professionalId.toString())),
    ];

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

    const existingAwaitingPaymentOrder = await this.orderModel
      .findOne({
        clientId: new Types.ObjectId(authUser.sub),
        professionalId: new Types.ObjectId(professionalId),
        type: OrderType.DIRECT,
        status: OrderStatus.AWAITING_PAYMENT,
        isDeleted: { $ne: true },
      })
      .lean()
      .exec();

    if (existingAwaitingPaymentOrder) {
      const mergedItemsByProductId = new Map(
        existingAwaitingPaymentOrder.items.map((item) => [
          item.productId.toString(),
          {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        ]),
      );

      for (const newItem of orderItems) {
        const key = newItem.productId.toString();
        const existingItem = mergedItemsByProductId.get(key);

        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          existingItem.unitPrice = newItem.unitPrice;
          continue;
        }

        mergedItemsByProductId.set(key, {
          productId: newItem.productId,
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice,
        });
      }

      const mergedItems = [...mergedItemsByProductId.values()];
      const mergedTotalPrice = mergedItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      await this.orderModel.findByIdAndUpdate(
        existingAwaitingPaymentOrder._id,
        {
          items: mergedItems,
          totalPrice: mergedTotalPrice,
        },
        { runValidators: true },
      );

      return this.findOne(existingAwaitingPaymentOrder._id.toString());
    }

    const order = await this.orderModel.create({
      clientId: new Types.ObjectId(authUser.sub),
      professionalId: new Types.ObjectId(professionalId),
      type: OrderType.DIRECT,
      status: OrderStatus.AWAITING_PAYMENT,
      totalPrice,
      items: orderItems,
    });

    // Send notification to professional
    const notification = await this.notificationsService.create({
      userId: new Types.ObjectId(professionalId),
      type: NotificationType.ORDER_ACCEPTED,
      title: 'New Order Received',
      message: `You have a new order for $${totalPrice.toFixed(2)}`,
      data: { orderId: order._id.toString(), totalPrice },
    });

    await this.notificationsGateway.sendNotificationToUser(professionalId, notification);

    return this.findOne(order._id.toString());
  }

  findAll(query: FindOrdersQueryDto) {
    return this.listOrdersByFilter({}, query);
  }

  async findClientOrders(authUser: AuthUser, query: FindOrdersQueryDto) {
    return this.listOrdersByFilter(
      {
        clientId: new Types.ObjectId(authUser.sub),
      },
      query,
    );
  }

  async findProfessionalOrders(authUser: AuthUser, query: FindOrdersQueryDto) {
    const professional = await this.getProfessionalForUserOrThrow(authUser);

    return this.listOrdersByFilter(
      {
        professionalId: professional._id,
      },
      query,
    );
  }

  findOne(id: string) {
    return this.orderModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
      .populate('clientId', 'firstName lastName email phone avatar')
      .populate('professionalId', 'businessName verified verificationStatus')
      .populate('items.productId', 'name price isAvailable status')
      .lean()
      .exec();
  }

  update() {
    throw new MethodNotAllowedException(
      'Generic order update is disabled. Use dedicated order action endpoints.',
    );
  }

  async remove(id: string, authUser: AuthUser) {
    const order = await this.orderModel.findById(id).lean().exec();

    if (!order || order.isDeleted) {
      throw new NotFoundException('Order not found');
    }

    if (authUser.role !== UserRole.ADMIN && order.clientId.toString() !== authUser.sub) {
      throw new BadRequestException('You can only delete your own orders');
    }

    if (
      authUser.role !== UserRole.ADMIN &&
      order.status !== OrderStatus.AWAITING_PAYMENT &&
      order.status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'You can only delete orders that are awaiting payment or already cancelled',
      );
    }

    await this.orderModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: OrderStatus.CANCELLED,
      },
      { runValidators: true },
    );

    return { message: 'Order deleted successfully' };
  }

  async removeItem(id: string, productId: string, authUser: AuthUser) {
    const order = await this.findActiveOrderOrThrow(id);

    this.ensureClientOwnsOrder(order.clientId, authUser, 'update');

    if (order.type !== OrderType.DIRECT) {
      throw new BadRequestException('You can only remove items from direct orders');
    }

    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new BadRequestException('You can only remove items from orders awaiting payment');
    }

    const remainingItems = order.items.filter((item) => item.productId.toString() !== productId);

    if (remainingItems.length === order.items.length) {
      throw new NotFoundException('Item not found in this order');
    }

    if (remainingItems.length === 0) {
      await this.orderModel.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          status: OrderStatus.CANCELLED,
          items: [],
          totalPrice: 0,
        },
        { runValidators: true },
      );

      return { message: 'Order cancelled because all items were removed' };
    }

    const nextTotalPrice = remainingItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    await this.orderModel.findByIdAndUpdate(
      id,
      {
        items: remainingItems,
        totalPrice: nextTotalPrice,
      },
      { runValidators: true },
    );

    return this.findOne(id);
  }

  async markPaid(id: string, authUser: AuthUser) {
    const order = await this.findActiveOrderOrThrow(id);

    this.ensureClientOwnsOrder(order.clientId, authUser, 'pay');

    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new BadRequestException('Only awaiting payment orders can be paid');
    }

    await this.setOrderStatus(id, OrderStatus.IN_PROGRESS);

    // Send notification to professional that payment was confirmed
    const notification = await this.notificationsService.create({
      userId: order.professionalId,
      type: NotificationType.PAYMENT_CONFIRMATION,
      title: 'Payment Confirmed',
      message: `Payment of $${order.totalPrice.toFixed(2)} confirmed for your order`,
      data: { orderId: order._id.toString(), amount: order.totalPrice },
    });

    await this.notificationsGateway.sendNotificationToUser(
      order.professionalId.toString(),
      notification,
    );

    return this.findOne(id);
  }

  async markReady(id: string, authUser: AuthUser) {
    const professional = await this.getProfessionalForUserOrThrow(authUser);
    const order = await this.findActiveOrderOrThrow(id);

    if (order.professionalId.toString() !== professional._id.toString()) {
      throw new BadRequestException('You can only update your own orders');
    }

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress orders can be marked ready');
    }

    await this.setOrderStatus(id, OrderStatus.READY);

    // Send notification to client that order is ready for pickup
    const notification = await this.notificationsService.create({
      userId: order.clientId,
      type: NotificationType.ORDER_READY,
      title: 'Your cake is ready for pickup',
      message: 'Your order is ready to pick up!',
      data: { orderId: order._id.toString() },
    });

    await this.notificationsGateway.sendNotificationToUser(order.clientId.toString(), notification);

    return this.findOne(id);
  }

  async reject(id: string, authUser: AuthUser) {
    const professional = await this.getProfessionalForUserOrThrow(authUser);
    const order = await this.findActiveOrderOrThrow(id);

    if (order.professionalId.toString() !== professional._id.toString()) {
      throw new BadRequestException('You can only update your own orders');
    }

    if (order.type !== OrderType.DIRECT) {
      throw new BadRequestException('Only direct orders can be rejected');
    }

    if (order.status !== OrderStatus.AWAITING_PAYMENT && order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Only awaiting payment or in-progress orders can be rejected');
    }

    await this.orderModel.findByIdAndUpdate(
      id,
      {
        status: OrderStatus.CANCELLED,
      },
      { runValidators: true },
    );

    // Send notification to client that order was rejected
    const notification = await this.notificationsService.create({
      userId: order.clientId,
      type: NotificationType.ORDER_REJECTED,
      title: 'Order Rejected',
      message: 'Unfortunately, your order has been rejected',
      data: { orderId: order._id.toString() },
    });

    await this.notificationsGateway.sendNotificationToUser(order.clientId.toString(), notification);

    return this.findOne(id);
  }

  async complete(id: string, authUser: AuthUser) {
    const order = await this.findActiveOrderOrThrow(id);

    this.ensureClientOwnsOrder(order.clientId, authUser, 'complete');

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Only ready orders can be completed');
    }

    await this.setOrderStatus(id, OrderStatus.COMPLETED);

    // Send notification to professional that order was completed
    const notification = await this.notificationsService.create({
      userId: order.professionalId,
      type: NotificationType.ORDER_COMPLETED,
      title: 'Order Completed',
      message: 'Your order has been completed by the customer',
      data: { orderId: order._id.toString() },
    });

    await this.notificationsGateway.sendNotificationToUser(
      order.professionalId.toString(),
      notification,
    );

    if (order.requestId) {
      await this.requestModel.findByIdAndUpdate(
        order.requestId,
        { status: RequestStatus.CLOSED },
        { runValidators: true },
      );
    }

    return this.findOne(id);
  }
}
