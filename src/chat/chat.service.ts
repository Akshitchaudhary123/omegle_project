import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '../room/room.entity';
import { Message, MessageDocument } from '../message/message.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    ) { }

    async createRoom(participants: string[]): Promise<RoomDocument> {
        if (!participants || participants.length < 2) {
            throw new BadRequestException('Room must have at least 2 participants');
        }
        const room = new this.roomModel({ 
            participants,
            isActive: true 
        });
        return room.save();
    }

    async saveMessage(payload: { roomId: string; senderId: string; content: string }): Promise<MessageDocument> {
        // Verify room exists and is active
        const room = await this.roomModel.findById(payload.roomId);
        if (!room) {
            throw new NotFoundException('Room not found');
        }
        if (!room.isActive) {
            throw new BadRequestException('Room is no longer active');
        }

        const msg = new this.messageModel({
            roomId: payload.roomId,
            senderId: payload.senderId,
            content: payload.content,
        });

        // Update room's last message
        room.lastMessage = payload.content;
        await room.save();

        return msg.save();
    }

    async getRoomById(roomId: string): Promise<RoomDocument> {
        const room = await this.roomModel.findById(roomId).populate('participants', 'name email');
        if (!room) {
            throw new NotFoundException('Room not found');
        }
        return room;
    }

    async getRoomMessages(roomId: string, limit: number = 50, skip: number = 0): Promise<MessageDocument[]> {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        return this.messageModel
            .find({ roomId })
            .populate('senderId', 'name email')
            .sort({ sentAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
    }

    async getUserRooms(userId: string): Promise<RoomDocument[]> {
        return this.roomModel
            .find({ 
                participants: userId,
                isActive: true 
            })
            .populate('participants', 'name email')
            .sort({ createdAt: -1 })
            .exec();
    }

    async endRoom(roomId: string, userId: string): Promise<RoomDocument> {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        // Verify user is a participant
        if (!room.participants.includes(userId)) {
            throw new BadRequestException('User is not a participant in this room');
        }

        room.isActive = false;
        room.endedAt = new Date();
        return room.save();
    }

    async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
        await this.messageModel.updateMany(
            { 
                roomId,
                senderId: { $ne: userId },
                isRead: false 
            },
            { isRead: true }
        );
    }
}
