import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AllergyDocument = Allergy & Document

@Schema()
export class Allergy {

    @Prop({ required: true, unique: true })
    name: string
}

export const AllergySchema = SchemaFactory.createForClass(Allergy)