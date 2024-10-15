import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsNumberString,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'name',
    example: 'Iphone 16',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'description',
    example: 'This is a phone',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'price',
    example: '1000000',
  })
  @IsNumberString()
  @IsNotEmpty()
  @MaxLength(15)
  @Matches(/^[0-9]+$/, {
    message: 'price must be a non-negative number string',
  })
  price: string;

  @ApiProperty({
    description: 'stock',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100000)
  stock: number;

  @ApiProperty({
    description: 'category_id',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  category_id: number;

  @ApiProperty({
    description: 'type',
    example: 'phone',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  type: string;

  @ApiProperty({
    description: 'attributes',
    example: { color: 'red', size: 'large' },
  })
  @IsObject()
  @IsNotEmptyObject()
  attributes: object;
}
