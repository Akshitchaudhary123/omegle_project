import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    age: number;

    @Prop({ required: true, enum: ['male', 'female', 'other'] })
    gender: string;

    @Prop({ required: true })
    password: string;

    // FIXED
    @Prop({ type: String, default: null })
    socketId?: string | null;

    @Prop({ default: true })
    isOnline: boolean;

    // FIXED (already correct, but ensure explicit type)
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', default: null })
    currentRoom: string | null;

    @Prop({ default: Date.now })
    lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
