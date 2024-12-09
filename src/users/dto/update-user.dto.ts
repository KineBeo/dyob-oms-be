import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsNumberString,
  Length,
  IsPhoneNumber,
  IsEmail,
  Matches,
  IsEnum,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto implements Partial<CreateUserDto> {
  @ApiProperty({
    example: 'Your changed name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  fullname?: string;

  @ApiProperty({
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  @Length(10, 10)
  @IsPhoneNumber('VN', {
    message: 'phone_number must be a Vietnamese phone number',
  })
  phone_number?: string;

  @ApiProperty({
    example: 'Your changed password',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password too weak. It must contain a combination of uppercase letters, lowercase letters, numbers, and symbols.',
    },
  )
  password_hash?: string;

  @ApiProperty({
    example: '012345678912',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(12)
  cccd?: string;

  @ApiProperty({
    example: 'VietComBank',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  bank_name?: string;
  

  @ApiProperty({
    example: '088888888',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  bank_account_number?: string;
}
