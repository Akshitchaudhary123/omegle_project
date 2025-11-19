import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Message content cannot be empty' })
  content: string;
}




