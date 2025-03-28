import { ApiProperty } from '@nestjs/swagger';
import {
	ArrayMinSize,
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumberString,
	IsOptional,
	IsPhoneNumber,
	IsString,
	Length,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserClass } from 'src/enum/user-class';
import { Role } from '@/enum/role';

class CreateSingleUserDto {
	@ApiProperty({
		description: 'Họ và tên của người dùng',
		example: 'Nguyễn Văn A',
		minLength: 6,
		maxLength: 50,
	})
	@IsString()
	@MinLength(6, { message: 'Họ và tên phải có ít nhất 6 ký tự' })
	@MaxLength(50, { message: 'Họ và tên không được vượt quá 50 ký tự' })
	@IsNotEmpty({ message: 'Họ và tên là bắt buộc' })
	fullname: string;

	@ApiProperty({
		description: 'Số điện thoại Việt Nam',
		example: '0353368921',
		minLength: 10,
		maxLength: 10,
	})
	@IsNumberString({}, { message: 'Số điện thoại chỉ được chứa các chữ số' })
	@IsNotEmpty({ message: 'Số điện thoại là bắt buộc' })
	@Length(10, 10, { message: 'Số điện thoại phải có đúng 10 chữ số' })
	@IsPhoneNumber('VN', { message: 'Phải là số điện thoại hợp lệ của Việt Nam' })
	phone_number: string;

	@ApiProperty({
		description: 'Mật khẩu với các yêu cầu cụ thể',
		example: 'StrongP@ssw0rd!',
	})
	@IsString()
	@IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
	@MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
	@MaxLength(200, { message: 'Mật khẩu không được vượt quá 200 ký tự' })
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
		{
			message:
				'Mật khẩu phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một số và một ký tự đặc biệt',
		},
	)
	password_hash: string;

	@ApiProperty({ description: 'Mã giới thiệu', example: 'DEFAULT_1', required: false })
	@IsString()
	@IsOptional()
	referral_code_of_referrer?: string;


	@ApiProperty({ description: 'Số điện thoại của người giới thiệu', example: '0353368921', required: false })
	@IsOptional()
	@IsNumberString({}, { message: 'Số điện thoại chỉ được chứa các chữ số' })
	@Length(10, 10, { message: 'Số điện thoại phải có đúng 10 chữ số' })
	@IsPhoneNumber('VN', { message: 'Phải là số điện thoại hợp lệ của Việt Nam' })

	parent_phone_number?: string;

	@ApiProperty({
		description: 'Gói dịch vụ người dùng chọn',
		enum: UserClass,
		default: UserClass.BASIC,
		required: false,
	})
	@IsEnum(UserClass)
	@IsOptional()
	user_class?: UserClass;

	@ApiProperty({
		description: 'User role',
		enum: Role,
		default: Role.USER,
		required: false,
	})
	@IsEnum(Role)
	@IsOptional()
	role?: Role;
}

export class CreateMultipleUsersDto {
	@ApiProperty({
		description: 'Danh sách người dùng',
		type: [CreateSingleUserDto],
	})
	@IsArray()
	@ArrayMinSize(1, { message: 'Phải có ít nhất một người dùng' })
	@ValidateNested({ each: true })
	@Type(() => CreateSingleUserDto)
	users: CreateSingleUserDto[];
}