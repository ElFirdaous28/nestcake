import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Types, Document } from "mongoose"

export type OrderDocument = Order & Document

@Schema({ _id: false })
export class OrderItem {

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId

    @Prop({ required: true })
    quantity: number

    @Prop({ required: true })
    unitPrice: number
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem)

@Schema({ timestamps: true })
export class Order {

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    clientId: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'Professional', required: true })
    professionalId: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'Request' })
    requestId?: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'Proposal' })
    proposalId?: Types.ObjectId

    @Prop({ required: true })
    type: string

    @Prop({ required: true })
    totalPrice: number

    @Prop({ required: true })
    status: string

    @Prop({ type: [OrderItemSchema], default: [] })
    items: OrderItem[]
}

export const OrderSchema = SchemaFactory.createForClass(Order)