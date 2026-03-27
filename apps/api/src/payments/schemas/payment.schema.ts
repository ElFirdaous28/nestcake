import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  status: string;

  @Prop()
  stripeTransactionId?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
