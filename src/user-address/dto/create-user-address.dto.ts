import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserAddressDto {
  @ApiProperty({
    description: 'user_id',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  user_id: number;

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
  receiver_name: string;

  @ApiProperty({
    description: 'phone_number',
    example: '0123456789',
  })
  @IsNumberString({}, { message: 'Phone number must contain only numbers' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Length(10, 10, { message: 'Phone number must be exactly 10 digits' })
  @IsPhoneNumber('VN', { message: 'Must be a valid Vietnamese phone number' })
  phone_number: string;

  @ApiProperty({
    description: 'province',
    example: 'Hanoi',
  })
  @IsString()
  province: string;

  @ApiProperty({
    description: 'district',
    example: 'Cau Giay',
  })
  @IsString()
  district: string;

  @ApiProperty({
    description: 'ward',
    example: 'Dich Vong Hau',
  })
  @IsString()
  ward: string;

  @ApiProperty({
    description: 'street_address',
    example: '123 ABC street',
  })
  @IsString()
  street_address: string;

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
