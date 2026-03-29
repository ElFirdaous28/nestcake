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
import { AuthUser, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order (client only)' })
  @ApiBody({
    type: CreateOrderDto,
    examples: {
      default: {
        value: {
          items: [
            { productId: '65f0c7e8f9697f3c69312345', quantity: 2 },
            { productId: '65f0c7e8f9697f3c69354321', quantity: 1 },
          ],
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user, createOrderDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all orders for admin' })
  @ApiQuery({ name: 'status', required: false, example: 'PENDING' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: FindOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current client orders' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('client')
  findClientOrders(
    @Req() req: Request & { user: AuthUser },
    @Query() query: FindOrdersQueryDto,
  ) {
    return this.ordersService.findClientOrders(req.user, query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current professional orders' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('professional')
  findProfessionalOrders(
    @Req() req: Request & { user: AuthUser },
    @Query() query: FindOrdersQueryDto,
  ) {
    return this.ordersService.findProfessionalOrders(req.user, query);
  }

  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete order (client/admin)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.ordersService.remove(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from order (client)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiParam({ name: 'productId', example: '65f0c7e8f9697f3c69354321' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Delete(':id/items/:productId')
  removeItem(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('productId', ParseObjectIdPipe) productId: string,
  ) {
    return this.ordersService.removeItem(id, productId, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as paid (client)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Patch(':id/pay')
  markPaid(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.ordersService.markPaid(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark order as ready (professional)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch(':id/ready')
  markReady(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.ordersService.markReady(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject order (professional)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Patch(':id/reject')
  reject(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.ordersService.reject(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete order (client)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Patch(':id/complete')
  complete(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.ordersService.complete(id, req.user);
  }
}
