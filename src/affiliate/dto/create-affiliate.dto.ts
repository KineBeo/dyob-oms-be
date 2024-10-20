import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAffiliateDto {
  @ApiProperty({
    description: 'user_id',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  user_id: number;

  @ApiProperty({
    description: 'referral_code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  referral_code: string;
}
