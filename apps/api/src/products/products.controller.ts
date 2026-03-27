import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthUser, ProductStatus, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(req.user, createProductDto);
  }

  @Get()
  findAllForClient(@Query() query: FindProductsQueryDto) {
    return this.productsService.findProducts({
      scope: 'client',
      options: query,
    });
  }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  findAllForAdmin(@Query() query: FindProductsQueryDto) {
    return this.productsService.findProducts({
      scope: 'admin',
      options: query,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch(':id')
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, req.user, updateProductDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.productsService.remove(id, req.user);
  }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Post('publish-all')
  publishAll(@Req() req: Request & { user: AuthUser }) {
    return this.productsService.publishAllProducts(req.user);
  }
}
