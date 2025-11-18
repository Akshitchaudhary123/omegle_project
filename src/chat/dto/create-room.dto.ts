import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Room must have at least 2 participants' })
  @IsString({ each: true })
  participants: string[];
}

