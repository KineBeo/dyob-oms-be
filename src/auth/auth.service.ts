import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserStatusService } from '../user-status/user-status.service';
import { UserRank } from 'src/enum/rank';
import * as jwt from 'jsonwebtoken';
import { UserClass } from 'src/enum/user-class';
import { CreateMultipleUsersDto } from './dto/create-multiple-users.dto';
import { create } from 'domain';
import User from '@/users/entities/user.entity';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private userStatusService: UserStatusService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
	  private dataSource: DataSource,
	  @InjectRepository(User)
	private userRepository: Repository<User>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      // Create the user first
      const user = await this.usersService.create(createUserDto);
      const { referral_code_of_referrer } = createUserDto;

      // Create associated profiles
      await this.userStatusService.create({
        user_id: user.id,
        referral_code_of_referrer: referral_code_of_referrer,
        user_rank: UserRank.GUEST,
        user_class: createUserDto.user_class,
      });

      return {
        user: {
          id: user.id,
          fullname: user.fullname,
          phone_number: user.phone_number,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new BadRequestException('Registration failed: ' + error);
    }
  }

  // * OK return access_token, refresh_token and user info. Delete all existing refresh tokens for the user when logging in
  async login(phone_number: string, password: string) {
    try {
      const user =
        await this.usersService.findByPhoneNumberWithPassword(phone_number);

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Invalidate all existing refresh tokens for the user
      await this.refreshTokenRepository.delete({ userId: user.id });

      const { access_token, refresh_token } = await this.generateTokens(
        user.id,
      );
      return {
        user: {
          id: user.id,
          fullname: user.fullname,
          phone_number: user.phone_number,
          role: user.role,
          cccd: user.cccd,
          bank_name: user.bank_name,
          bank_account_number: user.bank_account_number,
        },
        access_token,
        refresh_token,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException('Authentication failed: ' + error);
    }
  }
  // * OK
  private async generateTokens(userId: number) {
    const [access_token, refresh_token] = await Promise.all([
      this.generateAccessToken(userId),
      this.generateRefreshToken(userId),
    ]);

    return { access_token, refresh_token };
  }

  private async generateAccessToken(userId: number): Promise<string> {
    const payload = { sub: userId };
    const token = await this.jwtService.signAsync(payload);

    const decodedToken = jwt.decode(token) as { exp: number };
    const expirationTime = new Date(decodedToken.exp * 1000);
    console.log(`Token of user ${userId} expires at: ${expirationTime}`); // xoá sau khi test xong

    // Schedule a log when the token expires
    setTimeout(
      () => {
        console.log(`Token for user ${userId} has expired at: ${new Date()}`);
      },
      decodedToken.exp * 1000 - Date.now(),
    );

    return token;
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const refreshToken = new RefreshToken();
    refreshToken.token = uuidv4();
    refreshToken.userId = userId;
    refreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.refreshTokenRepository.save(refreshToken);
    return refreshToken.token;
  }

  async refreshAccessToken(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { access_token, refresh_token } = await this.generateTokens(
      token.userId,
    );
    await this.refreshTokenRepository.delete({ token: refreshToken });

    return {
      access_token,
      refresh_token,
    };
  }

  async logout(userId: number) {
    await this.refreshTokenRepository.delete({ userId });
    return { message: 'Logged out successfully' };
	}
	
	async createMultipleUsers(createMultipleUsersDto: CreateMultipleUsersDto) {
		const errors = [];
		const newPhoneNumbers = new Set();

		// check if users are valid
		for (const userDto of createMultipleUsersDto.users) {
			const { phone_number, parent_phone_number, referral_code_of_referrer } = userDto;

			// Check if phone number is existed
			const existingUser = await this.userRepository.findOne({
				where: { phone_number },
			});

			if (existingUser || newPhoneNumbers.has(phone_number)) {
				errors.push({ user: userDto, error: `Phone number ${phone_number} is already in use,` });
				continue;
			}

			if (referral_code_of_referrer) {
				// * Check if referrer existed
				const userStatusWithReferralCode =
					await this.userStatusService.findUserStatusByReferralCode(referral_code_of_referrer);

				if (!userStatusWithReferralCode) {
					errors.push({ user: userDto, error: `Invalid refferal code ${referral_code_of_referrer}` });
					continue;
				}
			}

			if (parent_phone_number && !newPhoneNumbers.has(parent_phone_number)) {
				const parentUser = await this.userRepository.findOne({
					where: { phone_number: parent_phone_number },
				});
				if (!parentUser) {
					errors.push({ user: userDto, error: `Parent phone number ${ parent_phone_number } does not exist`});
				continue;
			}
		}
			newPhoneNumbers.add(phone_number);
		}

		if (errors.length > 0) {
			throw new BadRequestException({
				message: 'Validation failed, no users created',
				failed: errors,
			});
		}

		// create users if no errors
		const createdUsers = [];
		for (const userDto of createMultipleUsersDto.users) {
			const { phone_number, password_hash, parent_phone_number, referral_code_of_referrer, ...rest } = userDto;
			const hashedPassword = await bcrypt.hash(password_hash, 10);

			const newUser = await this.usersService.create({
				...rest,
				phone_number,
				password_hash: hashedPassword,
			});

			let referralCode = referral_code_of_referrer || null;

			if (!referralCode && parent_phone_number) {
				const parentUser = await this.usersService.findByPhoneNumber(parent_phone_number);
				const parentUserStatus = await this.userStatusService.findReferrerByUserId(parentUser.id);
				if (parentUserStatus) {
					referralCode = parentUserStatus.personal_referral_code;
				}
			}

			await this.userStatusService.create({
				user_id: newUser.id,
				referral_code_of_referrer: referralCode,
				user_rank: UserRank.GUEST,
				user_class: UserClass.BASIC,
			});

			createdUsers.push(newUser);
		}

		return createdUsers;
	}

}
