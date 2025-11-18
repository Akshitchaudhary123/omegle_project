import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(socket: Socket) {
    const userId = socket.handshake.query.userId as string;
    if (!userId) {
      console.log('❌ User ID missing in connection');
      socket.disconnect();
      return;
    }

    // Store user and socket mapping in Redis
    await this.redisService.set(`socket:${socket.id}`, { userId });
    await this.redisService.set(`user:${userId}`, { socketId: socket.id });
    await this.redisService.sadd('onlineUsers', userId);

    console.log(`✅ User connected: ${userId} (${socket.id})`);
  }

  async handleDisconnect(socket: Socket) {
    const data = await this.redisService.get(`socket:${socket.id}`);
    if (!data) return;

    const { userId } = data;
    
    // Remove from waiting queue if present
    await this.redisService.srem('waitingUsers', userId);
    
    // End active rooms for this user
    const userRooms = await this.chatService.getUserRooms(userId);
    for (const room of userRooms) {
      if (room.isActive) {
        const roomId = String(room._id);
        await this.chatService.endRoom(roomId, userId);
        // Notify partner
        const partnerId = room.participants.find(p => p.toString() !== userId)?.toString();
        if (partnerId) {
          const partnerData = await this.redisService.get(`user:${partnerId}`);
          if (partnerData?.socketId) {
            this.server.to(partnerData.socketId).emit('partnerDisconnected', {
              roomId: roomId,
              message: 'Your partner has disconnected',
            });
          }
        }
      }
    }

    await this.redisService.srem('onlineUsers', userId);
    await this.redisService.del(`socket:${socket.id}`);
    await this.redisService.del(`user:${userId}`);

    console.log(`❌ User disconnected: ${userId}`);
  }

  // Random matchmaking (like Omegle)
  @SubscribeMessage('findPartner')
  async handleFindPartner(socket: Socket) {
    try {
      const userId = socket.handshake.query.userId as string;
      
      // Check if user is already in an active room
      const activeRooms = await this.chatService.getUserRooms(userId);
      if (activeRooms.length > 0) {
        socket.emit('error', { message: 'You are already in an active chat' });
        return;
      }

      const waitingUser = await this.redisService.spop('waitingUsers');

      if (!waitingUser || waitingUser === userId) {
        // No one waiting, add to queue
        await this.redisService.sadd('waitingUsers', userId);
        socket.emit('waiting', { message: 'Waiting for a partner...' });
      } else {
        // Found a partner, create room
        const room = await this.chatService.createRoom([userId, waitingUser]);

        // Get both socket IDs from Redis
        const socketA = (await this.redisService.get(`user:${userId}`))?.socketId;
        const socketB = (await this.redisService.get(`user:${waitingUser}`))?.socketId;

        // Join both users to the room
        const roomId = String(room._id);
        if (socketA) {
          const socketAInstance = this.server.sockets.sockets.get(socketA);
          socketAInstance?.join(roomId);
        }
        if (socketB) {
          const socketBInstance = this.server.sockets.sockets.get(socketB);
          socketBInstance?.join(roomId);
        }

        // Notify both users
        this.server.to(roomId).emit('partnerFound', {
          roomId: roomId,
          message: 'Partner found! You can start chatting now.',
        });
      }
    } catch (error) {
      console.error('Error in findPartner:', error);
      socket.emit('error', { message: 'Failed to find partner' });
    }
  }

  // When user sends message
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    socket: Socket,
    payload: { roomId: string; content: string },
  ) {
    try {
      const userId = socket.handshake.query.userId as string;
      
      if (!payload.roomId || !payload.content) {
        socket.emit('error', { message: 'Room ID and content are required' });
        return;
      }

      const msg = await this.chatService.saveMessage({
        roomId: payload.roomId,
        senderId: userId,
        content: payload.content,
      });

      // Broadcast to all users in the room
      this.server.to(payload.roomId).emit('receiveMessage', {
        _id: msg._id,
        roomId: msg.roomId,
        senderId: msg.senderId,
        content: msg.content,
        isRead: msg.isRead,
        sentAt: msg.sentAt,
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      socket.emit('error', { message: error.message || 'Failed to send message' });
    }
  }

  // Leave current room
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(socket: Socket, payload: { roomId: string }) {
    try {
      const userId = socket.handshake.query.userId as string;
      
      if (!payload.roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      await this.chatService.endRoom(payload.roomId, userId);
      
      // Leave socket room
      socket.leave(payload.roomId);
      
      // Notify partner
      const room = await this.chatService.getRoomById(payload.roomId);
      const partnerId = room.participants.find(p => p.toString() !== userId)?.toString();
      
      if (partnerId) {
        const partnerData = await this.redisService.get(`user:${partnerId}`);
        if (partnerData?.socketId) {
          this.server.to(partnerData.socketId).emit('partnerLeft', {
            roomId: payload.roomId,
            message: 'Your partner has left the chat',
          });
        }
      }

      socket.emit('roomLeft', { roomId: payload.roomId });
    } catch (error) {
      console.error('Error in leaveRoom:', error);
      socket.emit('error', { message: error.message || 'Failed to leave room' });
    }
  }

  // Skip current partner and find new one
  @SubscribeMessage('skipPartner')
  async handleSkipPartner(socket: Socket, payload: { roomId?: string }) {
    try {
      const userId = socket.handshake.query.userId as string;
      
      // End current room if exists
      if (payload.roomId) {
        try {
          await this.chatService.endRoom(payload.roomId, userId);
          socket.leave(payload.roomId);
        } catch (error) {
          // Room might not exist, continue anyway
        }
      }

      // Remove from waiting queue if present
      await this.redisService.srem('waitingUsers', userId);

      // Find new partner
      await this.handleFindPartner(socket);
    } catch (error) {
      console.error('Error in skipPartner:', error);
      socket.emit('error', { message: 'Failed to skip partner' });
    }
  }

  // Mark messages as read
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(socket: Socket, payload: { roomId: string }) {
    try {
      const userId = socket.handshake.query.userId as string;
      
      if (!payload.roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      await this.chatService.markMessagesAsRead(payload.roomId, userId);
      socket.emit('messagesRead', { roomId: payload.roomId });
    } catch (error) {
      console.error('Error in markAsRead:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }
}
