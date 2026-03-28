import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AuthUser,
  ProductStatus,
  ProfessionalVerificationStatus,
  UserRole,
} from '@shared-types';
import { Model, Types } from 'mongoose';
import { Category } from '../categories/schemas/category.schema';
import { Professional } from '../professionals/schemas/professional.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';

type ProductListScope = 'client' | 'professional' | 'admin';

type ProductListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Professional.name)
    private readonly professionalModel: Model<Professional>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) { }

  // ---------- Helpers ----------

  private async getProfessional(authUser: AuthUser) {
    const professional = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(authUser.sub) })
      .lean()
      .exec();

    if (!professional) {
      throw new NotFoundException('Professional profile not found');
    }

    return professional;
  }

  private ensureOwnership(
    productProfessionalId: string,
    myProfessionalId: string,
  ) {
    if (productProfessionalId !== myProfessionalId) {
      throw new ForbiddenException('You can only manage your own products');
    }
  }

  private normalizeCategoryIds(categoryIds: string[]) {
    return [...new Set(categoryIds.map((id) => id.trim()))];
  }

  private async ensureCategoriesExist(categoryIds: string[]) {
    const count = await this.categoryModel.countDocuments({
      _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) },
    });

    if (count !== categoryIds.length) {
      throw new BadRequestException('One or more categories were not found');
    }
  }

  // ---------- CRUD ----------

  async create(
    authUser: AuthUser,
    dto: CreateProductDto,
    file: Express.Multer.File,
  ) {
    const professional = await this.getProfessional(authUser);

    const categoryIds = this.normalizeCategoryIds(dto.categoryIds);
    await this.ensureCategoriesExist(categoryIds);

    const imageUrl = `/uploads/products/${file.filename}`;

    return this.productModel.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      price: dto.price,
      image: imageUrl,
      categoryIds: categoryIds.map((id) => new Types.ObjectId(id)),
      isAvailable: dto.isAvailable ?? true,
      status: dto.status ?? ProductStatus.DRAFT,
      professionalId: professional._id,
    });
  }

  async findProducts(params: {
    scope: ProductListScope;
    options?: ProductListOptions;
    authUser?: AuthUser;
  }) {
    const { scope, options = {}, authUser } = params;

    if (scope === 'client') {
      return this.findAllByFilter(
        { status: ProductStatus.PUBLISHED, isAvailable: true },
        options,
      );
    }

    if (scope === 'admin') {
      return this.findAllByFilter({}, options);
    }

    if (!authUser) {
      throw new ForbiddenException('Authentication required');
    }

    const professional = await this.getProfessional(authUser);

    return this.findAllByFilter({ professionalId: professional._id }, options);
  }

  private async findAllByFilter(
    baseFilter: Record<string, unknown>,
    options: ProductListOptions = {},
  ) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { ...baseFilter };

    if (options.search?.trim()) {
      const search = options.search.trim();
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (options.categoryId) {
      filter.categoryIds = new Types.ObjectId(options.categoryId);
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

  async update(
    id: string,
    authUser: AuthUser,
    dto: UpdateProductDto,
    file?: Express.Multer.File,
  ) {
    const professional = await this.getProfessional(authUser);

    const product = await this.productModel.findById(id).lean().exec();
    if (!product) throw new NotFoundException('Product not found');

    this.ensureOwnership(
      product.professionalId.toString(),
      professional._id.toString(),
    );

    const updateData = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );

    if (updateData.name) updateData.name = updateData.name.trim();
    if (typeof updateData.description === 'string') {
      updateData.description = updateData.description.trim() || undefined;
    }

    if (updateData.categoryIds) {
      const ids = this.normalizeCategoryIds(updateData.categoryIds as string[]);
      await this.ensureCategoriesExist(ids);
      updateData.categoryIds = ids.map((id) => new Types.ObjectId(id));
    }

    if (file) {
      updateData.image = `/uploads/products/${file.filename}`;
    }

    if (!Object.keys(updateData).length) {
      throw new BadRequestException('No update fields provided');
    }

    return this.productModel
      .findByIdAndUpdate(id, updateData, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean();
  }

  async remove(id: string, authUser: AuthUser) {

    const product = await this.productModel.findById(id).lean().exec();
    if (!product) throw new NotFoundException('Product not found');
    
    if (authUser.role === UserRole.PROFESSIONAL) {
      const professional = await this.getProfessional(authUser);

      this.ensureOwnership(
        product.professionalId.toString(),
        professional._id.toString(),
      );
    }

    await this.productModel.findByIdAndDelete(id);

    return { message: 'Product deleted successfully' };
  }

  async updateProductStatus(
    id: string,
    authUser: AuthUser,
    status: ProductStatus,
  ) {
    const professional = await this.getProfessional(authUser);

    if (
      status === ProductStatus.PUBLISHED &&
      professional.verificationStatus !==
      ProfessionalVerificationStatus.VERIFIED
    ) {
      throw new ForbiddenException(
        'Only verified professionals can publish products',
      );
    }

    const product = await this.productModel.findById(id).lean().exec();
    if (!product) throw new NotFoundException('Product not found');

    this.ensureOwnership(
      product.professionalId.toString(),
      professional._id.toString(),
    );

    return this.productModel
      .findByIdAndUpdate(
        id,
        { status },
        { returnDocument: 'after', runValidators: true },
      )
      .lean();
  }

  async publishAllProducts(authUser: AuthUser) {
    const professional = await this.getProfessional(authUser);

    if (
      professional.verificationStatus !==
      ProfessionalVerificationStatus.VERIFIED
    ) {
      throw new ForbiddenException(
        'Only verified professionals can publish products',
      );
    }

    const result = await this.productModel.updateMany(
      { professionalId: professional._id },
      { status: ProductStatus.PUBLISHED },
    );

    return { message: `${result.modifiedCount} products published` };
  }
}
