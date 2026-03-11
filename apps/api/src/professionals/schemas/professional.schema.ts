import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, Document } from 'mongoose'

export type ProfessionalDocument = Professional & Document

@Schema({ timestamps: true })
export class Professional {

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId

    @Prop({ required: true })
    businessName: string

    @Prop()
    description?: string

    @Prop({ default: false })
    verified: boolean

    @Prop()
    location: string
}

export const ProfessionalSchema = SchemaFactory.createForClass(Professional)