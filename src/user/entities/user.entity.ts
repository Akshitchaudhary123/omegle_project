import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    // 🧍 Basic profile details
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

    // Socket & chat-specific properties
    @Prop({ required: true, unique: true })
    socketId: string; // Used to identify the user's socket connection

    @Prop({ default: true })
    isOnline: boolean; // Used to track online/offline status

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', default: null })
    currentRoom: string | null; // The room user is currently in (null = not in any)

    @Prop({ default: Date.now })
    lastActive: Date; // Last active timestamp, useful for status updates
}

export const UserSchema = SchemaFactory.createForClass(User);
