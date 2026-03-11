import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Types, Document } from "mongoose"

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

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Allergy' }] })
    allergyIds: Types.ObjectId[]

    @Prop()
    budget?: number

    @Prop()
    deliveryDateTime: Date

    @Prop()
    location: string

    @Prop()
    status: string
}

export const RequestSchema = SchemaFactory.createForClass(Request)