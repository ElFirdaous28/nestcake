import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser, ProductStatus, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { multerDiskConfig } from '../common/upload.config';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (professional only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'price', 'categoryIds', 'image'],
      properties: {
        name: { type: 'string', example: 'Vanilla Birthday Cake' },
        description: {
          type: 'string',
          example: 'Two-layer vanilla sponge with buttercream frosting.',
        },
        price: { type: 'number', example: 49.99 },
        categoryIds: {
          type: 'array',
          items: { type: 'string', example: '65f0c7e8f9697f3c69312345' },
        },
        isAvailable: { type: 'boolean', example: true },
        status: { type: 'string', example: 'DRAFT' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @UseInterceptors(FileInterceptor('image', multerDiskConfig('products')))
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createProductDto: CreateProductDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.productsService.create(req.user, createProductDto, file);
  }

  @ApiOperation({ summary: 'List products for client' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'vanilla' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    example: '65f0c7e8f9697f3c69312345',
  })
  @Get()
  findAllForClient(@Query() query: FindProductsQueryDto) {
    return this.productsService.findProducts({
      scope: 'client',
      options: query,
    });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List products for current professional' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('professional')
  findAllForProfessional(
    @Req() req: Request & { user: AuthUser },
    @Query() query: FindProductsQueryDto,
  ) {
    return this.productsService.findProducts({
      scope: 'professional',
      authUser: req.user,
      options: query,
    });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List products for admin' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  findAllForAdmin(@Query() query: FindProductsQueryDto) {
    return this.productsService.findProducts({
      scope: 'admin',
      options: query,
    });
  }

  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (professional only)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Vanilla Birthday Cake Deluxe' },
        description: {
          type: 'string',
          example: 'Updated description for the product.',
        },
        price: { type: 'number', example: 59.99 },
        categoryIds: {
          type: 'array',
          items: { type: 'string', example: '65f0c7e8f9697f3c69312345' },
        },
        isAvailable: { type: 'boolean', example: true },
        status: { type: 'string', example: 'PUBLISHED' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @UseInterceptors(FileInterceptor('image', multerDiskConfig('products')))
  @Patch(':id')
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.update(id, req.user, updateProductDto, file);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (professional/admin)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Delete(':id')
  remove(@Req() req: Request & { user: AuthUser }, @Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.remove(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product status (professional only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'PUBLISHED' },
      },
      required: ['status'],
    },
    examples: {
      publish: { value: { status: 'PUBLISHED' } },
      draft: { value: { status: 'DRAFT' } },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch(':id/status')
  updateStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('status') status: ProductStatus,
  ) {
    return this.productsService.updateProductStatus(id, req.user, status);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish all my products (professional only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Post('publish-all')
  publishAll(@Req() req: Request & { user: AuthUser }) {
    return this.productsService.publishAllProducts(req.user);
  }
}
