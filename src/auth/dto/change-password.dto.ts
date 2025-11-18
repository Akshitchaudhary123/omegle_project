

import { IsString, MinLength, MaxLength, NotEquals } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Old password must be at least 6 characters long' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(32, { message: 'New password cannot exceed 32 characters' })
  newPassword: string;
}
