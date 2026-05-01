import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @ApiProperty({ example: 'newPassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
