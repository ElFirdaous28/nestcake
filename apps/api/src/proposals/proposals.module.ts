import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  Professional,
  ProfessionalSchema,
} from '../professionals/schemas/professional.schema';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import { Proposal, ProposalSchema } from './schemas/proposal.schema';
import { Request, RequestSchema } from '../requests/schemas/request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
      { name: Request.name, schema: RequestSchema },
      { name: Professional.name, schema: ProfessionalSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService],
})
export class ProposalsModule {}
