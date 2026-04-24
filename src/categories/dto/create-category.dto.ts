import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Eletrônicos' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Produtos eletrônicos em geral' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-category' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
