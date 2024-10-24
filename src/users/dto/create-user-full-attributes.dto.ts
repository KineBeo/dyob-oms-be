import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserFullAttributesDto {
    @IsString()
    @IsNotEmpty()
    fullname: string;

    @IsString()
    @IsNotEmpty()
    phone_number: string;

    @IsString()
    @IsOptional()
    email: string;

    @IsString()
    @IsNotEmpty()
    password_hash: string;

    @IsString()
    @IsNotEmpty()
    bank_name: string;

    @IsString()
    @IsNotEmpty()
    bank_account_number: string;

    @IsOptional()
    updatedAt?: Date;
}