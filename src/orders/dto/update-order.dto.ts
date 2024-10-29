import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max, IsNumberString, MinLength, MaxLength, Matches, IsString, IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../../enum/order-status';
export class UpdateOrderDto {
    @ApiProperty({
        description: 'user_id',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    @Max(100000)
    user_id: number;

    @ApiProperty({
        description: 'affiliate_id',
        example: 1,
        required: false,
    })
    @IsOptional()
    affiliate_id?: number;

    @ApiProperty({
        description: 'address',
        example: '123 ABC street',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(100)
    address: string;

    @ApiProperty({
        description: 'status',
        default: OrderStatus.NOT_START_YET
    })
    @IsEnum(OrderStatus)
    @IsNotEmpty()
    @MaxLength(50)
    status: OrderStatus;
}
