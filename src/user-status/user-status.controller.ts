import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UserStatusService } from './user-status.service';
import { CreateUserStatusDto } from './dto/create-user-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user-status')
@ApiTags('user-status')
export class UserStatusController {
  constructor(private readonly userStatusService: UserStatusService) {}

  @Post()
  @ApiOperation({ summary: 'Create user status' })
  create(@Body() createUserStatusDto: CreateUserStatusDto) {
    return this.userStatusService.create(createUserStatusDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user status' })
  findAll() {
    return this.userStatusService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') 
  @Get(':id')
  @ApiOperation({ summary: 'Get user status by id' })
  findOne(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You must be the owner of the user status to access this resource');
    }
    return this.userStatusService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user status by id' })
  update(@Param('id') id: number, @Body() updateUserStatusDto: UpdateUserStatusDto) {
    return this.userStatusService.update(+id, updateUserStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user status by id' })
  remove(@Param('id') id: number) {
    return this.userStatusService.remove(+id);
  }
}
