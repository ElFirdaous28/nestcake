import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Types, Document } from "mongoose"
import { RequestStatus } from "@shared-types"

export type RequestDocument = Request & Document

@Schema({ timestamps: true })
export class Request {

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    clientId: Types.ObjectId

    @Prop({ required: true })
    title: string

    @Prop()
    eventType?: string

    @Prop({ required: true })
    description: string

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Allergy' }], default: [] })
    allergyIds: Types.ObjectId[]

    @Prop()
    budget?: number
    
    @Prop({ required: true })
    deliveryDateTime: Date
    
    @Prop({ enum: ['delivery', 'pickup'], required: true })
    deliveryType: 'delivery' | 'pickup';

    @Prop()
    location?: string

    @Prop({ enum: RequestStatus, default: RequestStatus.OPEN })
    status: RequestStatus

    @Prop()
    images?: string[]
}

export const RequestSchema = SchemaFactory.createForClass(Request)