import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAffiliateProfileDto {
  @ApiProperty({
    description: 'user_id',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  user_id: number;
}
