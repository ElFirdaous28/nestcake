import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AllergiesService } from './allergies.service';
import { AllergiesController } from './allergies.controller';
import { Allergy, AllergySchema } from './schemas/allergy.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Allergy.name, schema: AllergySchema }]), AuthModule],

  controllers: [AllergiesController],
  providers: [AllergiesService],
})
export class AllergiesModule {}
