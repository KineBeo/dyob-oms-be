import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "src/enum/order-status";

export class UpdateOrderStatusDto {
    @ApiProperty({
        enum: OrderStatus,
        description: 'Status of the order',
        example: OrderStatus.NOT_START_YET,
        enumName: 'OrderStatus'
    })
    status: OrderStatus;
}