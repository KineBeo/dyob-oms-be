import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsNumberString, IsString, Matches, Max, max, MaxLength, Min, MinLength } from "class-validator";

export class CreateAffiliateDto {
    @ApiProperty({
        description: 'referral_code',
        example: '123456',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    referral_code: string;

    @ApiProperty({
        description: 'user_id',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    user_id: number;

    @ApiProperty({
        description: 'parent_id',
        example: 1,
    })
    @IsNumber()
    @Min(0)
    parent_id: number;

    @ApiProperty({
        description: 'level',
        example: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(3)
    level: number;

    // checked
    @ApiProperty({
        description: 'personal_income',
        example: '1000000',
    })
    @IsNumberString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(15)
    @Matches(/^[0-9]+$/, {
        message: 'personal_income must be a non-negative number string',
    })
    personal_income: string;

    // checked
    @ApiProperty({
        description: 'group_income',
        example: '1000000',
    })
    @IsNumberString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(15)
    @Matches(/^[0-9]+$/, {
        message: 'group_income must be a non-negative number string',
    })
    group_income: string;

    @ApiProperty({
        description: 'commission',
        example: '1000',
    })
    @IsNumberString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(15)
    @Matches(/^[0-9]+$/, {
        message: 'commission must be a non-negative number string',
    })
    commission: string;
}
