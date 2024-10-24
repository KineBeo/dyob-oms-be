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

export class CreateAffiliateDto {
  @ApiProperty({
    description: 'referral_code',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  referral_code: string;

  @ApiProperty({
    description: 'user_id',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  user_id: number;

  @ApiProperty({
    description: 'parent_affiliate_id',
    example: '1',
  })
  @IsOptional()
  @IsNumber()
  parent_affiliate_id?: number;
}
