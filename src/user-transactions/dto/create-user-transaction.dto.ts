import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsString } from 'class-validator';
import { TransactionType } from 'src/enum/transactionType';

export class CreateUserTransactionDto {
  @ApiProperty({
    description: 'Transaction type',
    example: 'PURCHASE',
  })
  @IsString()
  transaction_type: TransactionType;

  @ApiProperty({
    description: 'Amount',
    example: '1000',
  })
  @IsString()
  amount: string;

  @ApiProperty({
    description: 'Description',
    example: 'Purchase of product A',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Transaction ID',
    example: '123456',
  })
  @IsNumber()
  @Min(1)
  user_status_id: number;
}
