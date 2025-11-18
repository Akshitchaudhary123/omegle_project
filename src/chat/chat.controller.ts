import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GetMessagesDto } from './dto/get-messages.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getUserRooms(@CurrentUser() user: any) {
    return this.chatService.getUserRooms(user.userId || user._id);
  }

  @Get('rooms/:roomId')
  async getRoomById(@Param('roomId') roomId: string) {
    return this.chatService.getRoomById(roomId);
  }

  @Get('rooms/:roomId/messages')
  async getRoomMessages(
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.chatService.getRoomMessages(roomId, query.limit, query.skip);
  }

  @Post('rooms/:roomId/end')
  async endRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user._id;
    return this.chatService.endRoom(roomId, userId);
  }

  @Post('rooms/:roomId/messages/read')
  async markMessagesAsRead(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.userId || user._id;
    await this.chatService.markMessagesAsRead(roomId, userId);
    return { message: 'Messages marked as read' };
  }
}
