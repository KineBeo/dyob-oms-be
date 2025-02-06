import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsNumberString } from 'class-validator';
import { TransactionType } from 'src/enum/transactionType';

export class CreateUserTransactionDto {
  @ApiProperty()
  @IsNumberString()
  amount: string;

  @ApiProperty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty()
  @IsNumber()
  userId: number;
}
