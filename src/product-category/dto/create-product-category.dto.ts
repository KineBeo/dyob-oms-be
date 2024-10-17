import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateProductCategoryDto {
    @ApiProperty({
        description: 'The name of the product category',
        example: 'Electronics',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @ApiProperty({
        description: 'The description of the product category',
        example: 'This category contains all electronic devices',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiProperty({
        description: 'The ID of the parent category',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(200)
    parent_id?: number;
}
