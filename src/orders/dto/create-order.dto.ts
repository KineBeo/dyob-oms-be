import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNumberString } from "class-validator";
import { OrderStatus } from "src/enum/order-status";

export class CreateOrderDto {
    @ApiProperty({
        description: 'user_id',
        example: 1,
    })
    @IsNumber()
    user_id: number;

    @ApiProperty({
        description: 'affiliate_id',
        example: 1,
    })
    @IsNumber()
    affiliate_id: number;

    @ApiProperty({
        description: 'total_amount',
        example: '1000000',
    })
    @IsNumberString()
    total_amount: string;

    @ApiProperty({
        description: 'status',
        default: OrderStatus.NOT_START_YET
    })
    status: OrderStatus;

    @ApiProperty({
        description: 'created_at',
        example: '2021-08-24 00:00:00',
    })
    created_at: Date;
}
