import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({
    description: 'name',
    example: 'Electronics',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'description',
    example: 'This category contains all electronics',
  })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Parent ID',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  parent_id: number;
}
