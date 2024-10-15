import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsNumberString, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateCartDto {
    @ApiProperty({
        description: 'user_id',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    user_id: number;

    @ApiProperty({
        description: 'productId',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    productId: number;

    @ApiProperty({
        description: 'quantity',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Max(100)
    quantity: number;

    @ApiProperty({
        description: 'price',
        example: 100,
    })
    @IsNumberString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(30)
    @Matches(/^[1-9]\d*$/, { message: 'Price must be a string representing a positive number without leading zeros' })
    price: string;
}
