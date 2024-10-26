import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsPhoneNumber, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";
import { UserRole } from "../../enum/rank";
export class CreateUserDto {

    // checked
    @ApiProperty({
        description: 'fullname',
        example: 'Donald Trump',
    })
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @IsNotEmpty()
    fullname: string;

    // checked
    @ApiProperty({
        description: 'phone_number',
        example: '0123456789',
    })
    @IsNumberString()
    @IsNotEmpty()
    @Length(10, 10)
    @IsPhoneNumber('VN', { message: 'phone_number must be a Vietnamese phone number' })
    phone_number: string;

    // checked
    @ApiProperty({
        description: 'email',
        example: 'example@gmail.com',
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    // checked
    @ApiProperty({
        description: 'password',
        example: 'StrongP@ssw0rd!',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(200)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password too weak. It must contain a combination of uppercase letters, lowercase letters, numbers, and symbols.',
    })
    password_hash: string;
}

