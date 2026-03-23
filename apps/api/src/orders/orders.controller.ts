import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthUser, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user, createOrderDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: FindOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('client')
  findClientOrders(
    @Req() req: Request & { user: AuthUser },
    @Query() query: FindOrdersQueryDto,
  ) {
    return this.ordersService.findClientOrders(req.user, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('professional')
  findProfessionalOrders(
    @Req() req: Request & { user: AuthUser },
    @Query() query: FindOrdersQueryDto,
  ) {
    return this.ordersService.findProfessionalOrders(req.user, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.ordersService.remove(id, req.user);
  }
}
