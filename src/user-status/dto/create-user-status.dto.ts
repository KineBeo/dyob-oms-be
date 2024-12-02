import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UserRank } from '../../enum/rank';
import { UserClass } from 'src/enum/user-class';

export class CreateUserStatusDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  user_id: number;

  @ApiProperty({
    description: 'referral code of referrer',
    example: 'DEFAULT_1',
  })
  @IsString()
  @IsOptional()
  referral_code_of_referrer?: string;

  @ApiProperty({
    description: 'User rank',
    enum: UserRank,
    example: UserRank.GUEST,
  })
  @IsEnum(UserRank)
  user_rank: UserRank;

  @ApiProperty({
    description: 'User class',
    example: 'BASIC',
    enum: UserClass,
  })
  @IsEnum(UserClass)
  @IsOptional()
  user_class?: UserClass;
}
