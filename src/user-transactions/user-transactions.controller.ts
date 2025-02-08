import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserTransactionsService } from './user-transactions.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/enum/role';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('user-transactions')
@ApiTags('User Transactions')
export class UserTransactionsController {
  constructor(
    private readonly userTransactionsService: UserTransactionsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.userTransactionsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user transaction by id' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.userTransactionsService.findOne(+id, req.user.sub);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user transactions by user id' })
  findByUserId(@Param('id') id: string, @Request() req) {
    return this.userTransactionsService.findByUserId(req.user.sub);
  }
}
