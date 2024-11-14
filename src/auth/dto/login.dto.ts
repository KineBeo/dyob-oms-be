import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'phone number',
    example: '0123456789',
  })
  @IsPhoneNumber('VN')
  phone_number: string;

  @ApiProperty({
    description: 'password',
    example: 'StrongP@ssw0rd!',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
