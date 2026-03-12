import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { Professional, ProfessionalSchema } from './schemas/professional.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Professional.name, schema: ProfessionalSchema }])],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
})
export class ProfessionalsModule {}
