import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<Category>) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const normalizedName = createCategoryDto.name.trim();

    const exists = await this.categoryModel
      .findOne({ name: { $regex: `^${this.escapeRegex(normalizedName)}$`, $options: 'i' } })
      .lean()
      .exec();

    if (exists) {
      throw new ConflictException('Category name already exists');
    }

    try {
      return await this.categoryModel.create({ name: normalizedName });
    } catch {
      throw new BadRequestException('Could not create category');
    }
  }

  async findAll() {
    return this.categoryModel.find().sort({ name: 1 }).lean().exec();
  }

  async findOne(id: string) {
    const category = await this.categoryModel.findById(id).lean().exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const updateData = Object.fromEntries(
      Object.entries(updateCategoryDto).filter(([, value]) => value !== undefined),
    );

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    if (updateData.name) {
      const duplicate = await this.categoryModel
        .findOne({
          _id: { $ne: id },
          name: { $regex: `^${this.escapeRegex(updateData.name)}$`, $options: 'i' },
        })
        .lean()
        .exec();

      if (duplicate) {
        throw new ConflictException('Category name already exists');
      }
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Category not found');
    }

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.categoryModel.findByIdAndDelete(id).lean().exec();

    if (!deleted) {
      throw new NotFoundException('Category not found');
    }

    return { message: 'Category deleted successfully' };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
