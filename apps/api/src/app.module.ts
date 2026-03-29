import { join } from 'path';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
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
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nestcake'),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveStaticOptions: { index: false },
    }),
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

export class AppModule {
  constructor() {
    // This will run when the app starts
    console.log('--- Environment Check ---');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Connected to URI' : 'Using Default Localhost');
    console.log('Actual URI being used:', process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nestcake');
    console.log('-------------------------');
  }
}