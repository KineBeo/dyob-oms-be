import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { Public } from './decorator/public.decorator';
import { Role } from '@/enum/role';
import User from '@/users/entities/user.entity';
import { Roles } from './decorator/roles.decorator';
import { CreateMultipleUsersDto } from './dto/create-multiple-users.dto';
import { AdminGuard } from './guards/admin.guard';
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered.',
  })
  @ApiBody({ type: CreateUserDto })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in.',
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.phone_number, loginDto.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token successfully refreshed.',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') // Reference the bearer auth defined in main.ts
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged out.',
  })
  async logout(@Req() req: Request) {
    return this.authService.logout(req.user['sub']);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth') // Reference the bearer auth defined in main.ts
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the current user profile.',
  })
  getProfile(@Req() req: Request) {
    return req.user;
	}

	@Post('create-multiple-users')
	@UseGuards(JwtAuthGuard, AdminGuard)
	@Roles(Role.ADMIN)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'ADMIN: Create multiple users' })
	@ApiResponse({
		status: 201,
		description: 'Users has been successfully created.',
		type: User,
	})
	createMultipleUsers(@Body() createMultipleUsersDto: CreateMultipleUsersDto) {
		return this.authService.createMultipleUsers(createMultipleUsersDto);
	}
}
