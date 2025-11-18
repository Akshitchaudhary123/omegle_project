import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/entities/user.entity';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true })
  participants: string[]; 
  // Array of user IDs (2 users for random chat, but can extend later)

  @Prop({ default: true })
  isActive: boolean; 
  // True when chat is ongoing, false when ended/disconnected

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  @Prop({ type: String, default: null })
  lastMessage: string | null; 
  // Optional preview or cache of last message (for performance)
}

export const RoomSchema = SchemaFactory.createForClass(Room);
