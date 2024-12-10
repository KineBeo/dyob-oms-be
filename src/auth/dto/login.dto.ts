import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'phone number',
    example: '0353227709',
  })
  @IsPhoneNumber('VN')
  phone_number: string;

  @ApiProperty({
    description: 'password',
    example: 'Admin123@!',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
