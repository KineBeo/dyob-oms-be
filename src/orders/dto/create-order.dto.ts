import { Optional } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { OrderStatus } from "src/enum/order-status";

export class CreateOrderDto {
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
    @Optional()
    affiliate_id?: number;

    // @ApiProperty({
    //     description: 'total_amount',
    //     example: '0',
    // })
    // @IsNumberString()
    // @IsNotEmpty()
    // @MinLength(1)
    // @MaxLength(20)
    // @Matches(/^[0-9]+$/, {
    //     message: 'total_amount must be a non-negative number string',
    // })
    // total_amount: string;

    @ApiProperty({
        description: 'address',
        example: '123 ABC street',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(100)
    address: string;

    // @ApiProperty({
    //     description: 'status',
    //     default: OrderStatus.NOT_START_YET
    // })
    // @IsEnum(OrderStatus)
    // @IsNotEmpty()
    // @MaxLength(50)
    // status: OrderStatus;
}
