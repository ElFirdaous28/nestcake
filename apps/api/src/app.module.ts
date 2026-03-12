import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { RequestsModule } from './requests/requests.module';
import { ProposalsModule } from './proposals/proposals.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AllergiesModule } from './allergies/allergies.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nestcake'),
    UsersModule,
    ProfessionalsModule,
    ProductsModule,
    CategoriesModule,
    RequestsModule,
    ProposalsModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    AllergiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
