import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNumberString, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateProductDto {
    @ApiProperty({
        description: 'name',
        example: 'Iphone 16',
    })
    @IsString()
    @MaxLength(50)
    name: string;

    @ApiProperty({
        description: 'description',
        example: 'This is a phone',
    })
    @IsString()
    @MaxLength(500)
    description: string;

    @ApiProperty({
        description: 'price',
        example: '1000000',
    })
    @IsNumberString()
    @MaxLength(15)
    price: string;

    @ApiProperty({
        description: 'stock',
        example: 100,
    })
    @IsNumber()
    @Max(100000)
    stock: number;

    @ApiProperty({
        description: 'category_id',
        example: 1,
    })
    @IsNumber()
    category_id: number;

    @ApiProperty({
        description: 'type',
        example: 'phone',
    })      
    @IsString()
    @MaxLength(500)
    type: string;

    @ApiProperty({
        description: 'attributes',
        example: {color: 'red', size: 'large'},
    }) 
    attributes: object;

    @ApiProperty({
        description: 'last_update',
        example: '2021-08-24 00:00:00',
    })
    last_update: Date;
}
