import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { Allergy } from './schemas/allergy.schema';

@Injectable()
export class AllergiesService {
  constructor(@InjectModel(Allergy.name) private readonly allergyModel: Model<Allergy>) {}

  async create(createAllergyDto: CreateAllergyDto) {
    const normalizedName = createAllergyDto.name.trim();

    const exists = await this.allergyModel
      .findOne({
        name: {
          $regex: `^${this.escapeRegex(normalizedName)}$`,
          $options: 'i',
        },
      })
      .lean()
      .exec();

    if (exists) {
      throw new ConflictException('Allergy name already exists');
    }

    try {
      return await this.allergyModel.create({ name: normalizedName });
    } catch {
      throw new BadRequestException('Could not create allergy');
    }
  }

  async findAll() {
    return this.allergyModel.find().sort({ name: 1 }).lean().exec();
  }

  async findOne(id: string) {
    const allergy = await this.allergyModel.findById(id).lean().exec();

    if (!allergy) {
      throw new NotFoundException('Allergy not found');
    }

    return allergy;
  }

  async update(id: string, updateAllergyDto: UpdateAllergyDto) {
    const updateData = Object.fromEntries(
      Object.entries(updateAllergyDto).filter(([, value]) => value !== undefined),
    );

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    if (updateData.name) {
      const duplicate = await this.allergyModel
        .findOne({
          _id: { $ne: id },
          name: {
            $regex: `^${this.escapeRegex(updateData.name)}$`,
            $options: 'i',
          },
        })
        .lean()
        .exec();

      if (duplicate) {
        throw new ConflictException('Allergy name already exists');
      }
    }

    const updated = await this.allergyModel
      .findByIdAndUpdate(id, updateData, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Allergy not found');
    }

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.allergyModel.findByIdAndDelete(id).lean().exec();

    if (!deleted) {
      throw new NotFoundException('Allergy not found');
    }

    return { message: 'Allergy deleted successfully' };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
