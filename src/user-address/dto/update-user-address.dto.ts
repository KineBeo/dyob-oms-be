import { PartialType } from '@nestjs/mapped-types';
import { CreateUserAddressDto } from './create-user-address.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsNumberString,
  Length,
  IsPhoneNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateUserAddressDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @MinLength(6, { message: 'Fullname must be at least 6 characters long' })
  @MaxLength(50, { message: 'Fullname must not exceed 50 characters' })
  @IsNotEmpty({ message: 'Fullname is required' })
  @IsOptional()
  receiver_name?: string;

  @ApiProperty({
    description: 'phone_number',
    example: '0123456789',
  })
  @IsNumberString({}, { message: 'Phone number must contain only numbers' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Length(10, 10, { message: 'Phone number must be exactly 10 digits' })
  @IsPhoneNumber('VN', { message: 'Must be a valid Vietnamese phone number' })
  @IsOptional()
  phone_number?: string;

  @ApiProperty({
    description: 'province',
    example: 'Hanoi',
  })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({
    description: 'district',
    example: 'Cau Giay',
  })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({
    description: 'ward',
    example: 'Dich Vong Hau',
  })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({
    description: 'street_address',
    example: '123 ABC street',
  })
  @IsString()
  @IsOptional()
  street_address?: string;

  @ApiProperty({
    description: 'notes',
    example: 'Near the park',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'is_default',
    example: false,
    required: false,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
