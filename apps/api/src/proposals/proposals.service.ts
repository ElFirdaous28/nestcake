import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AuthUser,
  OrderStatus,
  OrderType,
  ProposalStatus,
  RequestStatus,
  UserRole,
  NotificationType,
} from '@shared-types';
import { Model, Types } from 'mongoose';
import { Order } from '../orders/schemas/order.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { Request } from '../requests/schemas/request.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { Proposal } from './schemas/proposal.schema';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private readonly proposalModel: Model<Proposal>,
    @InjectModel(Request.name) private readonly requestModel: Model<Request>,
    @InjectModel(Professional.name)
    private readonly professionalModel: Model<Professional>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(authUser: AuthUser, createProposalDto: CreateProposalDto) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    const request = await this.requestModel.findById(createProposalDto.requestId).lean().exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('You can only propose on OPEN requests');
    }

    const existing = await this.proposalModel
      .findOne({ requestId: request._id, professionalId: professional._id })
      .lean()
      .exec();

    if (existing && existing.status !== ProposalStatus.WITHDRAWN) {
      throw new BadRequestException('You already submitted a proposal for this request');
    }

    const proposal = await this.proposalModel.create({
      requestId: request._id,
      professionalId: professional._id,
      price: createProposalDto.price,
      message: createProposalDto.message?.trim() || undefined,
      deliveryDateTime: createProposalDto.deliveryDateTime,
      status: ProposalStatus.PENDING,
    });

    // Send notification to client that a professional has proposed
    const notification = await this.notificationsService.create({
      userId: request.clientId,
      type: NotificationType.NEW_PROPOSAL,
      title: 'New Proposal Received',
      message: `${professional.businessName} responded to your request`,
      data: {
        proposalId: proposal._id.toString(),
        professionalName: professional.businessName,
        price: proposal.price,
      },
    });

    await this.notificationsGateway.sendNotificationToUser(
      request.clientId.toString(),
      notification,
    );

    return proposal;
  }

  findAllForAdmin() {
    return this.proposalModel
      .find()
      .populate('requestId')
      .populate('professionalId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findMy(authUser: AuthUser) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    return this.proposalModel
      .find({ professionalId: professional._id })
      .populate('requestId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findByRequest(authUser: AuthUser, requestId: string) {
    const request = await this.requestModel.findById(requestId).lean().exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (authUser.role !== UserRole.ADMIN && request.clientId.toString() !== authUser.sub) {
      throw new ForbiddenException('You can only view proposals for your own requests');
    }

    return this.proposalModel
      .find({ requestId: new Types.ObjectId(requestId) })
      .populate('professionalId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async accept(authUser: AuthUser, proposalId: string) {
    const proposal = await this.proposalModel.findById(proposalId).lean().exec();

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Only pending proposals can be accepted');
    }

    const request = await this.requestModel.findById(proposal.requestId).lean().exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.clientId.toString() !== authUser.sub) {
      throw new ForbiddenException('You can only accept proposals on your own requests');
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Request is not open for accepting proposals');
    }

    const existingOrder = await this.orderModel
      .findOne({ requestId: request._id, isDeleted: { $ne: true } })
      .lean()
      .exec();

    if (existingOrder) {
      throw new BadRequestException('Order already exists for this request');
    }

    const order = await this.orderModel.create({
      clientId: request.clientId,
      professionalId: proposal.professionalId,
      requestId: request._id,
      proposalId: proposal._id,
      type: OrderType.CUSTOM_REQUEST,
      totalPrice: proposal.price,
      status: OrderStatus.AWAITING_PAYMENT,
      items: [],
    });

    await Promise.all([
      this.proposalModel.findByIdAndUpdate(proposal._id, {
        status: ProposalStatus.ACCEPTED,
      }),
      this.proposalModel.updateMany(
        {
          requestId: request._id,
          _id: { $ne: proposal._id },
          status: ProposalStatus.PENDING,
        },
        { status: ProposalStatus.REJECTED },
      ),
      this.requestModel.findByIdAndUpdate(request._id, {
        status: RequestStatus.MATCHED,
      }),
    ]);

    // Send notification to professional that their proposal was accepted
    const professional = await this.professionalModel
      .findById(proposal.professionalId)
      .lean()
      .exec();

    if (professional) {
      const notification = await this.notificationsService.create({
        userId: proposal.professionalId,
        type: NotificationType.ORDER_ACCEPTED,
        title: 'Proposal Accepted!',
        message: `Your proposal worth $${proposal.price.toFixed(2)} has been accepted`,
        data: {
          orderId: order._id.toString(),
          proposalId: proposal._id.toString(),
          price: proposal.price,
        },
      });

      await this.notificationsGateway.sendNotificationToUser(
        proposal.professionalId.toString(),
        notification,
      );
    }

    return this.orderModel
      .findById(order._id)
      .populate('clientId', 'firstName lastName email phone avatar')
      .populate('professionalId', 'businessName verified verificationStatus')
      .lean()
      .exec();
  }
}
