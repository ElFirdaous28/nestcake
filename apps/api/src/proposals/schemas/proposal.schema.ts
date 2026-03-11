import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Types, Document } from "mongoose"

export type ProposalDocument = Proposal & Document

@Schema({ timestamps: true })
export class Proposal {

    @Prop({ type: Types.ObjectId, ref: 'Request', required: true })
    requestId: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'Professional', required: true })
    professionalId: Types.ObjectId

    @Prop({ required: true })
    price: number

    @Prop()
    message?: string

    @Prop()
    deliveryDateTime?: Date

    @Prop()
    status: string
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal)