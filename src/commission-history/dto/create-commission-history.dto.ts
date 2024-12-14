import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';

export class CreateCommissionHistoryDto {
  @ApiProperty({ description: 'ID of the user status', example: 1 })
  @IsInt()
  @IsPositive()
  userStatusId: number;

  @ApiProperty({ description: 'Monthly commission amount', example: '1000000' })
  @IsString()
  @IsNotEmpty()
  monthlyCommission: string;

  // @ApiProperty({ description: 'Group commission amount', example: '3000000' })
  // @IsString()
  // @IsNotEmpty()
  // groupCommission: string;

  @ApiProperty({ description: 'Month of the commission', example: 1 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Year of the commission', example: 2021 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  year: number;
}
