import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthUser, ProfessionalVerificationStatus, UserRole } from '@shared-types';
import { Model, Types } from 'mongoose';
import { Category } from '../categories/schemas/category.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Professional.name) private readonly professionalModel: Model<Professional>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async create(authUser: AuthUser, createProductDto: CreateProductDto) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    const categoryIds = this.normalizeCategoryIds(createProductDto.categoryIds);
    await this.ensureCategoriesExist(categoryIds);

    return this.productModel.create({
      name: createProductDto.name.trim(),
      description: createProductDto.description?.trim() || undefined,
      price: createProductDto.price,
      categoryIds: categoryIds.map((categoryId) => new Types.ObjectId(categoryId)),
      isAvailable: createProductDto.isAvailable ?? true,
      status: createProductDto.status ?? 'draft',
      professionalId: professional._id,
    });
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    includeUnpublished?: boolean;
  } = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;
    const search = options.search?.trim() || '';
    const includeUnpublished = options.includeUnpublished ?? false;

    const filter: any = {};

    if (!includeUnpublished) {
      filter.status = 'published';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
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
    const product = await this.productModel.findById(id).lean().exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, authUser: AuthUser, updateProductDto: UpdateProductDto) {
    const existing = await this.productModel.findById(id).lean().exec();

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.ensureCanManageProduct(authUser, existing.professionalId.toString());

    const updateData = Object.fromEntries(
      Object.entries(updateProductDto).filter(([, value]) => value !== undefined),
    );

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (typeof updateData.description === 'string') {
      updateData.description = updateData.description.trim() || undefined;
    }

    if (updateData.categoryIds) {
      const normalizedCategoryIds = this.normalizeCategoryIds(updateData.categoryIds as string[]);
      await this.ensureCategoriesExist(normalizedCategoryIds);
      updateData.categoryIds = normalizedCategoryIds.map((categoryId) => new Types.ObjectId(categoryId));
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    const updated = await this.productModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    return updated;
  }

  async remove(id: string, authUser: AuthUser) {
    const existing = await this.productModel.findById(id).lean().exec();

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.ensureCanManageProduct(authUser, existing.professionalId.toString());

    await this.productModel.findByIdAndDelete(id).lean().exec();

    return { message: 'Product deleted successfully' };
  }

  private normalizeCategoryIds(categoryIds: string[]) {
    return [...new Set(categoryIds.map((categoryId) => categoryId.trim()))];
  }

  private async ensureCategoriesExist(categoryIds: string[]) {
    const count = await this.categoryModel.countDocuments({
      _id: { $in: categoryIds.map((categoryId) => new Types.ObjectId(categoryId)) },
    });

    if (count !== categoryIds.length) {
      throw new BadRequestException('One or more categories were not found');
    }
  }

  private async ensureCanManageProduct(authUser: AuthUser, professionalId: string) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    if (professional._id.toString() !== professionalId) {
      throw new ForbiddenException('You can only manage your own products');
    }
  }

  async updateProductStatus(id: string, authUser: AuthUser, status: 'draft' | 'published') {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    if (status === 'published' && professional.verificationStatus !== ProfessionalVerificationStatus.VERIFIED) {
      throw new ForbiddenException('Only verified professionals can publish products');
    }

    const product = await this.productModel.findById(id).lean().exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.professionalId.toString() !== professional._id.toString()) {
      throw new ForbiddenException(`You can only ${status} your own products`);
    }

    return this.productModel
      .findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
  }


  async publishAllProducts(authUser: AuthUser) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    if (professional.verificationStatus !== ProfessionalVerificationStatus.VERIFIED) {
      throw new ForbiddenException('Only verified professionals can publish products');
    }

    const result = await this.productModel
      .updateMany(
        { professionalId: professional._id },
        { status: 'published' },
        { runValidators: true },
      )
      .exec();

    return { message: `${result.modifiedCount} products published` };
  }
}
