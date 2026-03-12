import 'dotenv/config';
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
import { AuthModule } from './auth/auth.module';

function normalizeMongoDbName(uri: string) {
  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, '');

    if (!dbName) {
      return uri;
    }

    parsed.pathname = `/${dbName.toLowerCase()}`;
    return parsed.toString();
  } catch {
    return uri;
  }
}

const mongoUri = normalizeMongoDbName(
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nestcake',
);

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
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
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
