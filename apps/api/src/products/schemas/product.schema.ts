import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ProductStatus } from "@shared-types";
import { Document, Types } from "mongoose";

export type ProductDocument = Product & Document

@Schema({ timestamps: true })
export class Product {

    @Prop({ type: Types.ObjectId, ref: 'Professional', required: true })
    professionalId: Types.ObjectId

    @Prop({ required: true })
    name: string

    @Prop()
    description?: string

    @Prop({ required: true })
    price: number

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }] })
    categoryIds: Types.ObjectId[]

    @Prop({ default: true })
    isAvailable: boolean

    @Prop({ enum: ProductStatus, default: ProductStatus.DRAFT })
    status: ProductStatus
}

export const ProductSchema = SchemaFactory.createForClass(Product)