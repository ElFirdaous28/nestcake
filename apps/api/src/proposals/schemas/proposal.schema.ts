import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProposalStatus } from '@shared-types';
import { Types, Document } from 'mongoose';

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'Request', required: true })
  requestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Professional', required: true })
  professionalId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop()
  message?: string;

  @Prop()
  deliveryDateTime?: Date;

  @Prop({
    enum: ProposalStatus,
    required: true,
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);
