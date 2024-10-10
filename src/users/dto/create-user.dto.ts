import { ApiProperty } from "@nestjs/swagger";
import { IsAlpha, IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Rank } from "src/enum/rank";

export class CreateUserDto {

    @ApiProperty({
        description: 'fullname',
        example: 'Donald Trump',
    })
    @IsString()
    fullname: string;
    
    @ApiProperty({
        description: 'phone_number',
        example: '0123456789',
    })
    @IsString()
    @IsPhoneNumber('VN')
    phone_number: string;
    
    @ApiProperty({
        description: 'email',
        example: 'example@gmail.com',
    })
    @IsString()
    @IsEmail()
    email: string;
    
    @ApiProperty({
        description: 'password',
    })
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    @MaxLength(200)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password too weak. It must contain a combination of uppercase letters, lowercase letters, numbers, and symbols.',
    })
    password_hash: string;
    
    @ApiProperty({
        description: 'rank',
        default: Rank.KHL,
    })
    rank: Rank;
    
    @ApiProperty({
        description: 'personal_income',
        example: '1000000',
    })
    @IsString()
    @MaxLength(15)
    personal_income: string;
    
    @ApiProperty({
        description: 'group_income',
        example: '1000000',
    })
    @IsString()
    @MaxLength(15)
    group_income: string;
    
    @ApiProperty({
        description: 'total_purchase',
        example: '1000000',
    })
    @IsString()
    @MaxLength(15)
    total_purchase: string;
    
    @ApiProperty({
        description: 'bank_name',
        example: 'Vietcombank',
    })
    @IsString()
    @MaxLength(50)
    bank_name: string;
    
    @ApiProperty({
        description: 'bank_account_number',
        example: '123456789',
    })
    @IsString()
    @MaxLength(15)
    @MinLength(9)
    bank_account_number: string;
    
    @ApiProperty({
        description: 'created_at',
        example: '2021-01-01T00:00:00.000Z',
    })
    created_at: Date;
    
    @ApiProperty({
        description: 'updated_at',
        example: '2021-01-01T00:00:00.000Z',
    })
    updated_at: Date;
}

