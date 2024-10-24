import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength, MaxLength, IsNumberString, Length, IsPhoneNumber, IsEmail, Matches, IsEnum } from "class-validator";
import { UserRole } from "../../enum/rank";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto implements Partial<CreateUserDto> {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    fullname?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumberString()
    @Length(10, 10)
    @IsPhoneNumber('VN', { message: 'phone_number must be a Vietnamese phone number' })
    phone_number?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @IsEmail()
    email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MinLength(8)
    @MaxLength(200)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password too weak. It must contain a combination of uppercase letters, lowercase letters, numbers, and symbols.',
    })
    password_hash?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(UserRole)
    @MaxLength(5)
    role?: UserRole;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    bank_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumberString()
    @MaxLength(15)
    @MinLength(9)
    @Matches(/^[0-9]+$/, {
        message: 'bank_account_number must be a non-negative number string',
    })
    bank_account_number?: string;
}