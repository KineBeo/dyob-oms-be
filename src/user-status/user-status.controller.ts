import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UserStatusService } from './user-status.service';
import { CreateUserStatusDto } from './dto/create-user-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/enum/role';

@Controller('user-status')
@ApiTags('user-status')
export class UserStatusController {
  constructor(private readonly userStatusService: UserStatusService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Create user status' })
  create(@Body() createUserStatusDto: CreateUserStatusDto) {
    return this.userStatusService.create(createUserStatusDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Get all user status' })
  findAll() {
    return this.userStatusService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user status by id' })
  findOne(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException(
        'You must be the owner of the user status to access this resource',
      );
    }
    return this.userStatusService.findOne(+id);
  }

  @Get('referrer/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user status by referrer id' })
  findByReferrerId(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException(
        'You must be the owner of the user status to access this resource',
      );
    }

    return this.userStatusService.findReferralLevels(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user status by id' })
  update(
    @Param('id') id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @Request() req,
  ) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException(
        'You must be the owner of the user status to update this resource',
      );
    }
    return this.userStatusService.update(+id, updateUserStatusDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Delete user status by id' })
  remove(@Param('id') id: number) {
    return this.userStatusService.remove(+id);
  }
}
