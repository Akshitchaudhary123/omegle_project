import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { Room } from '../room/room.entity';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', required: true })
    roomId: string;
    // The room this message belongs to

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    senderId: string;
    // The user who sent the message

    @Prop({ type: String, required: true })
    content: string;
    // Actual message text

    @Prop({ type: Boolean, default: false })
    isRead: boolean;
    // Whether the recipient has read it

    @Prop({ type: Date, default: Date.now })
    sentAt: Date;
    // Time message was sent
}

export const MessageSchema = SchemaFactory.createForClass(Message);
