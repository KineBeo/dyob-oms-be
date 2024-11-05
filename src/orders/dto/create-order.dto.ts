import { Optional } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { OrderStatus } from "../../enum/order-status";

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
        description: 'referral_code_of_referrer',
        example: 'DEFAULT_1',
        required: false,
        nullable: true,
    })
    @Optional()
    referral_code_of_referrer?: string;

    @ApiProperty({
        description: 'address',
        example: '123 ABC street',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(100)
    address: string;
}
