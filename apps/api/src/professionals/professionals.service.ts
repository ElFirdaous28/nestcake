import { Injectable, NotFoundException } from '@nestjs/common';
import { unlinkSync } from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { AuthUser, ProfessionalVerificationStatus } from '@shared-types';
import { Model, Types } from 'mongoose';
import { Professional } from './schemas/professional.schema';
import { UpdateMyProfessionalDto } from './dto/update-my-professional.dto';
import { AddProfessionalPortfolioItemDto } from './dto/add-professional-portfolio-item.dto';
import { UpdateProfessionalVerificationDto } from './dto/update-professional-verification.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectModel(Professional.name)
    private readonly professionalModel: Model<Professional>,
  ) {}

  async findAll() {
    return this.professionalModel.find().lean().exec();
  }

  async findOne(id: string) {
    const professional = await this.professionalModel
      .findById(id)
      .lean()
      .exec();
    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    return professional;
  }

  async getMe(authUser: AuthUser) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    return professional;
  }

  async updateMe(authUser: AuthUser, dto: UpdateMyProfessionalDto) {
    const updateData = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );

    const updated = await this.professionalModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(authUser.sub) },
        updateData,
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Professional profile not found');
    }

    return updated;
  }

  async addPortfolioItem(
    authUser: AuthUser,
    file: Express.Multer.File,
    dto: AddProfessionalPortfolioItemDto,
  ) {
    const imageUrl = `/uploads/portfolio/${file.filename}`;
    const portfolioItem: {
      images: string[];
      title?: string;
      description?: string;
    } = {
      images: [imageUrl],
    };

    if (dto.title != null) {
      portfolioItem.title = dto.title;
    }

    if (dto.description != null) {
      portfolioItem.description = dto.description;
    }

    const updated = await this.professionalModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(authUser.sub) },
        {
          $push: {
            portfolio: portfolioItem,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();

    if (!updated) {
      unlinkSync(file.path);
      throw new NotFoundException('Professional profile not found');
    }

    return updated;
  }

  async removePortfolioItem(authUser: AuthUser, portfolioItemId: string) {
    const updated = await this.professionalModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(authUser.sub) },
        { $pull: { portfolio: { _id: new Types.ObjectId(portfolioItemId) } } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Professional profile not found');
    }

    return updated;
  }

  async updateVerification(
    professionalId: string,
    dto: UpdateProfessionalVerificationDto,
  ) {
    const updated = await this.professionalModel
      .findByIdAndUpdate(
        professionalId,
        {
          verificationStatus: dto.verificationStatus,
          verified:
            dto.verificationStatus === ProfessionalVerificationStatus.VERIFIED,
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Professional not found');
    }

    return updated;
  }
}
