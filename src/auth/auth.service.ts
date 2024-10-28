import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AffiliateProfileService } from '../affiliate-profile/affiliate-profile.service';
import { UserStatusService } from '../user-status/user-status.service';
import { UserRole } from 'src/enum/rank';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private affiliateProfileService: AffiliateProfileService,
    private userStatusService: UserStatusService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private dataSource: DataSource,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the user first
      const user = await this.usersService.create(createUserDto);

      // Create associated profiles within the same transaction
      await Promise.all([
        this.affiliateProfileService.create({ 
          user_id: user.id 
        }),
        this.userStatusService.create({ 
          user_id: user.id,
          isAffiliate: false,
          total_purchase: "0",
          total_orders: 0,
          user_rank: UserRole.NVTN,
        })
      ]);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return {
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          phone_number: user.phone_number,
        }
      };

    } catch (error) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new BadRequestException(
        'Registration failed: ' + error
      );

    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await this.usersService.findByEmailWithPassword(email);

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const {access_token, refresh_token} = await this.generateTokens(user.id);
      return {
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          phone_number: user.phone_number,
        },
        access_token,
        refresh_token,
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      throw error;
    }
  }

  private async generateTokens(userId: number) {
    const [access_token, refresh_token] = await Promise.all([
      this.generateAccessToken(userId),
      this.generateRefreshToken(userId),
    ]);

    return { access_token, refresh_token };
  }

  private async generateAccessToken(userId: number): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
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

    const accessToken = await this.generateAccessToken(token.userId);
    return { accessToken };
  }

  async logout(userId: number) {
    await this.refreshTokenRepository.delete({ userId });
    return { message: 'Logged out successfully' };
  }
}
