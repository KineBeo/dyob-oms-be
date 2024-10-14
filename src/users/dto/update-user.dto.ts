import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// Extend the CreateUserDto class and make all its properties optional
export class UpdateUserDto extends PartialType(CreateUserDto) {}