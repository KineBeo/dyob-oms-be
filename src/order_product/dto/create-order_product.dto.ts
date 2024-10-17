import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumber,
    IsNumberString,
    Matches,
    Max,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class CreateOrderProductDto {
    @ApiProperty({
        description: 'The id of the order',
        example: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(100000)
    order_id: number;

    @ApiProperty({
        description: 'The id of the product',
        example: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(100000)
    product_id: number;

    @ApiProperty({
        description: 'The quantity of the product',
        example: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(100)
    quantity: number;

    @ApiProperty({
        description: 'The price of the product',
        example: '100000',
    })
    @IsNumberString()
    @MinLength(1)
    @MaxLength(10)
    @Matches(/^[1-9]\d*$/, {
        message:
            'Price must be a string representing a positive number without leading zeros',
    })
    price: string;
}
