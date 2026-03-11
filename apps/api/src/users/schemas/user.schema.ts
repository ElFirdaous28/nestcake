import { UserRole } from '@shared-types'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {

    @Prop({ required: true })
    firstName: string

    @Prop({ required: true })
    lastName: string

    @Prop({ required: true, unique: true })
    email: string

    @Prop({ required: true })
    password: string

    @Prop()
    phone?: string

    @Prop({ enum: UserRole, default: UserRole.CLIENT })
    role: UserRole
}

export const UserSchema = SchemaFactory.createForClass(User)