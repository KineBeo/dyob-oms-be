import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateAffiliateDto {
    @ApiProperty({
        description: 'referral_code',
        example: '123456',
    })
    @IsString()
    referral_code: string;

    @ApiProperty({
        description: 'user_id',
        example: 1,
    })
    @IsNumber()
    user_id: number;

    @ApiProperty({
        description: 'parent_id',
        example: 1,
    })
    @IsNumber()
    parent_id: number;

    @ApiProperty({
        description: 'level',
        example: 1,
    })
    @IsNumber()
    level: number;

    @ApiProperty({
        description: 'commission',
        example: '1000',
    })
    commission: string;
}
