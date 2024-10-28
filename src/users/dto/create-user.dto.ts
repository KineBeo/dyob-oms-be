import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsPhoneNumber, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";
import { UserRole } from "../../enum/rank";
export class CreateUserDto {
 @ApiProperty({
        description: 'Full name of the user',
        example: 'John Doe',
        minLength: 6,
        maxLength: 50
    })
    @IsString()
    @MinLength(6, { message: 'Fullname must be at least 6 characters long' })
    @MaxLength(50, { message: 'Fullname must not exceed 50 characters' })
    @IsNotEmpty({ message: 'Fullname is required' })
    fullname: string;

    @ApiProperty({
        description: 'Vietnamese phone number',
        example: '0123456789',
        minLength: 10,
        maxLength: 10
    })
    @IsNumberString({}, { message: 'Phone number must contain only numbers' })
    @IsNotEmpty({ message: 'Phone number is required' })
    @Length(10, 10, { message: 'Phone number must be exactly 10 digits' })
    @IsPhoneNumber('VN', { message: 'Must be a valid Vietnamese phone number' })
    phone_number: string;

    @ApiProperty({
        description: 'Email address',
        example: 'example@gmail.com'
    })
    @IsString()
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Must be a valid email address' })
    email: string;

    @ApiProperty({
        description: 'Password with specific requirements',
        example: 'StrongP@ssw0rd!'
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(200, { message: 'Password must not exceed 200 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
    )
    password_hash: string;
}

