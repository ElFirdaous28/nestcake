import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthUser, DeliveryType, RequestStatus, UserRole } from '@shared-types';
import { Model, Types } from 'mongoose';
import { Request, RequestDocument } from './schemas/request.schema';
import { User } from '../users/schemas/user.schema';
import { Allergy } from '../allergies/schemas/allergy.schema';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Allergy.name) private readonly allergyModel: Model<Allergy>,
  ) {}

  async create(
    authUser: AuthUser,
    createRequestDto: CreateRequestDto,
    file?: Express.Multer.File,
  ) {
    // Verify user is client
    const user = await this.userModel.findById(authUser.sub).lean().exec();
    if (!user || user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create requests');
    }

    // Validate allergies exist
    if (createRequestDto.allergyIds?.length) {
      const count = await this.allergyModel.countDocuments({
        _id: {
          $in: createRequestDto.allergyIds.map((id) => new Types.ObjectId(id)),
        },
      });
      if (count !== createRequestDto.allergyIds.length) {
        throw new BadRequestException('One or more allergies not found');
      }
    }

    // Validate delivery date is at least 24 hours from now
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (new Date(createRequestDto.deliveryDateTime) < twentyFourHoursLater) {
      throw new BadRequestException(
        'Delivery date must be at least 24 hours from now',
      );
    }

    // Validate location for delivery type
    if (
      createRequestDto.deliveryType === DeliveryType.DELIVERY &&
      !createRequestDto.location?.trim()
    ) {
      throw new BadRequestException('Location is required for delivery orders');
    }

    const images: string[] = [];
    if (file) {
      images.push(`/uploads/requests/${file.filename}`);
    }
    if (createRequestDto.images?.length) {
      images.push(...createRequestDto.images);
    }

    const requestData: any = {
      clientId: new Types.ObjectId(authUser.sub),
      title: createRequestDto.title.trim(),
      description: createRequestDto.description.trim(),
      eventType: createRequestDto.eventType?.trim(),
      budget: createRequestDto.budget,
      deliveryDateTime: createRequestDto.deliveryDateTime,
      deliveryType: createRequestDto.deliveryType,
      allergyIds:
        createRequestDto.allergyIds?.map((id) => new Types.ObjectId(id)) || [],
      images,
      status: RequestStatus.OPEN,
    };

    if (
      createRequestDto.deliveryType === DeliveryType.DELIVERY &&
      createRequestDto.location
    ) {
      requestData.location = createRequestDto.location.trim();
    }

    const request = await this.requestModel.create(requestData);

    return this.populateRequest(request._id.toString());
  }

  async findAll(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const filter: any = { status: RequestStatus.OPEN };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .populate('clientId', 'firstName lastName avatar')
        .populate('allergyIds')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.requestModel.countDocuments(filter),
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

  async findMyRequests(authUser: AuthUser, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.requestModel
        .find({ clientId: new Types.ObjectId(authUser.sub) })
        .populate('clientId', 'firstName lastName avatar')
        .populate('allergyIds')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.requestModel.countDocuments({
        clientId: new Types.ObjectId(authUser.sub),
      }),
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

  async findOne(id: string) {
    return this.populateRequest(id);
  }

  async update(
    id: string,
    authUser: AuthUser,
    updateRequestDto: UpdateRequestDto,
    file?: Express.Multer.File,
  ) {
    const request = await this.requestModel.findById(id).lean().exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Only client who created the request can update it
    if (request.clientId.toString() !== authUser.sub) {
      throw new ForbiddenException('You can only update your own requests');
    }

    // Cannot update if request is not OPEN
    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException(
        `Cannot update request with status ${request.status}`,
      );
    }

    const updateData: any = {};

    if (updateRequestDto.title !== undefined) {
      updateData.title = updateRequestDto.title.trim();
    }

    if (updateRequestDto.description !== undefined) {
      updateData.description = updateRequestDto.description.trim();
    }

    if (updateRequestDto.eventType !== undefined) {
      updateData.eventType = updateRequestDto.eventType?.trim();
    }

    if (updateRequestDto.budget !== undefined) {
      updateData.budget = updateRequestDto.budget;
    }

    if (updateRequestDto.deliveryDateTime !== undefined) {
      const now = new Date();
      const twentyFourHoursLater = new Date(
        now.getTime() + 24 * 60 * 60 * 1000,
      );
      if (new Date(updateRequestDto.deliveryDateTime) < twentyFourHoursLater) {
        throw new BadRequestException(
          'Delivery date must be at least 24 hours from now',
        );
      }
      updateData.deliveryDateTime = updateRequestDto.deliveryDateTime;
    }

    if (updateRequestDto.deliveryType !== undefined) {
      updateData.deliveryType = updateRequestDto.deliveryType;
      // If changing to dropdown delivery, location is required
      if (
        updateRequestDto.deliveryType === DeliveryType.DELIVERY &&
        !updateRequestDto.location?.trim() &&
        !request.location
      ) {
        throw new BadRequestException(
          'Location is required when delivery type is set to delivery',
        );
      }
    }

    if (updateRequestDto.location !== undefined) {
      if (updateRequestDto.location && updateRequestDto.location.trim()) {
        updateData.location = updateRequestDto.location.trim();
      } else if (
        updateRequestDto.deliveryType === DeliveryType.PICKUP ||
        updateData.deliveryType === DeliveryType.PICKUP
      ) {
        updateData.location = undefined;
      }
    }

    if (updateRequestDto.allergyIds !== undefined) {
      if (updateRequestDto.allergyIds.length) {
        const count = await this.allergyModel.countDocuments({
          _id: {
            $in: updateRequestDto.allergyIds.map(
              (id) => new Types.ObjectId(id),
            ),
          },
        });
        if (count !== updateRequestDto.allergyIds.length) {
          throw new BadRequestException('One or more allergies not found');
        }
      }
      updateData.allergyIds = updateRequestDto.allergyIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (file || updateRequestDto.images !== undefined) {
      const images: string[] = [];
      if (file) {
        images.push(`/uploads/requests/${file.filename}`);
      }
      if (updateRequestDto.images?.length) {
        images.push(...updateRequestDto.images);
      }
      updateData.images = images;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    const updated = await this.requestModel
      .findByIdAndUpdate(id, updateData, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Request not found');
    }

    return this.populateRequest(id);
  }

  async remove(id: string, authUser: AuthUser) {
    const request = await this.requestModel.findById(id).lean().exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.clientId.toString() !== authUser.sub) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException(
        `Cannot delete request with status ${request.status}`,
      );
    }

    await this.requestModel.findByIdAndDelete(id).exec();

    return { message: 'Request deleted successfully' };
  }

  async updateStatus(id: string, authUser: AuthUser, status: RequestStatus) {
    const request = await this.requestModel.findById(id).lean().exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.clientId.toString() !== authUser.sub) {
      throw new ForbiddenException(
        'You can only update status of your own requests',
      );
    }

    const allowedClientStatuses = new Set<RequestStatus>([
      RequestStatus.CANCELLED,
      RequestStatus.CLOSED,
    ]);

    if (!allowedClientStatuses.has(status)) {
      throw new BadRequestException(
        'Client can only set status to CANCELLED or CLOSED',
      );
    }

    if (request.status === status) {
      throw new BadRequestException(`Request is already ${status}`);
    }

    if (
      request.status === RequestStatus.CANCELLED ||
      request.status === RequestStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Cannot change status from ${request.status}`,
      );
    }

    const updated = await this.requestModel
      .findByIdAndUpdate(
        id,
        { status },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Request not found');
    }

    return this.populateRequest(id);
  }

  private async populateRequest(id: string) {
    return this.requestModel
      .findById(id)
      .populate('clientId', 'firstName lastName avatar email phone')
      .populate('allergyIds')
      .lean()
      .exec();
  }
}
