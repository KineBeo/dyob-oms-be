import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import User from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../enum/role';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * ! Only admin should be able to access this endpoint
   * @param createUserDto
   * @returns
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Create a user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: User,
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * ! Only admin should be able to access this endpoint
   * TODO: Add admin guard here
   * @returns
   */
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.', type: User })
  findAll() {
    return this.usersService.findAll();
  }

  /**
   *
   * @param id: id of the user to be found (user only can access their own information)
   * @param req: request from the current user
   * @returns
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('id/:id')
  @ApiOperation({ summary: 'Find a user by id' })
  findOne(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.usersService.findOne(id);
  }

  /**
   *
   * @param id
   * @param updateUserDto
   * @param req
   * @returns
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('id/:id')
  @ApiOperation({ summary: 'Update a user by id' })
  update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch('admin/id/:id')
  @ApiOperation({ summary: 'ADMIN: Update a user role by id' })
  updateRole(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  /**
   * ! Only admin should be able to access this endpoint
   * @param id
   * @returns
   */
  @Delete('id/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Delete a user by id' })
  remove(@Param('id') id: number) {
    return this.usersService.remove(+id);
  }

  // /**
  //  * TODO: Only admin should be able to access this endpoint
  //  * @param email
  //  * @returns
  //  */
  // @Get('email')
  // @UseGuards(JwtAuthGuard, AdminGuard)
  // @Roles(Role.ADMIN)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'ADMIN: Find a user by email' })
  // @ApiQuery({ name: 'email', required: true, type: String })
  // @ApiResponse({ status: 200, description: 'Return the user.', type: User })
  // @ApiResponse({ status: 404, description: 'User not found.' })
  // findByEmail(@Query('email') email: string) {
  //   return this.usersService.findByEmail(email);
  // }

  /**
   * TODO: Only admin should be able to access this endpoint
   * @param phone_number
   * @returns
   */
  @Get('phone')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Find a user by phone number' })
  @ApiQuery({ name: 'phone_number', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Return the user.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findByPhone(@Query('phone_number') phone_number: string) {
    return this.usersService.findByPhoneNumber(phone_number);
  }
}
