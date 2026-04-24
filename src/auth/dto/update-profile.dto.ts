import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'currentPassword123' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'newPassword123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
