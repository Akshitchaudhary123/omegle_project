import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Message, MessageSchema } from '../message/message.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Room, RoomSchema } from '../room/room.entity';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    RedisModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule { }
