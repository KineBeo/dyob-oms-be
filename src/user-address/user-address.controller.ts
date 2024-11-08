import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UserAddressService } from './user-address.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/enum/role';

@Controller('user-address')
@ApiTags('User Address')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create an address' })
  create(@Body() createUserAddressDto: CreateUserAddressDto, @Request() req) {
    if (Number(req.user.sub) !== Number(createUserAddressDto.user_id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.userAddressService.create(createUserAddressDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Get all addresses' })
  findAll() {
    return this.userAddressService.findAll();
  }

  @Get('/user/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all addresses of a user' })
  findOne(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.userAddressService.getUserAddresses(+id);
  }

  @Get('/default/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get default address of a user' })
  findDefault(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.userAddressService.getDefaultAddress(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an address' })
  update(@Param('id') id: number, @Request() req, @Body() updateUserAddressDto: UpdateUserAddressDto) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.userAddressService.update(+id, updateUserAddressDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an address' })
  remove(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.userAddressService.remove(+id);
  }
}
