import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Professional, ProfessionalSchema } from '../professionals/schemas/professional.schema';
import { Request, RequestSchema } from '../requests/schemas/request.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Professional.name, schema: ProfessionalSchema },
      { name: Request.name, schema: RequestSchema },
    ]),
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
