import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ProfessionalVerificationStatus } from '@shared-types'
import { Types, Document } from 'mongoose'

export type ProfessionalDocument = Professional & Document

@Schema({ _id: true })
class PortfolioItem {
    _id?: Types.ObjectId;

    @Prop()
    title?: string;

    @Prop()
    description?: string;

    @Prop([String])
    images: string[];
}

const PortfolioItemSchema = SchemaFactory.createForClass(PortfolioItem);

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
    address: string;

    @Prop({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
        },
    })
    location: { type: 'Point'; coordinates: [number, number] };

    @Prop({
        enum: ProfessionalVerificationStatus,
        default: ProfessionalVerificationStatus.PENDING,
    })

    verificationStatus: ProfessionalVerificationStatus;

    @Prop({ type: [PortfolioItemSchema], default: [] })
    portfolio: PortfolioItem[];
}

export const ProfessionalSchema = SchemaFactory.createForClass(Professional)