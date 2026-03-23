import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthUser, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

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
  findAll() {
    return this.productsService.findAll({
      page: 1,
      limit: 20,
      search: '',
      includeUnpublished: false,
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
  remove(@Req() req: Request & { user: AuthUser }, @Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.remove(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch(':id/status')
  updateStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('status') status: 'draft' | 'published',
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
