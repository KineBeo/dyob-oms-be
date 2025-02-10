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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('user-transactions')
@ApiTags('User Transactions')
export class UserTransactionsController {
  constructor(
    private readonly userTransactionsService: UserTransactionsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user transactions' })
  findAll() {
    return this.userTransactionsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user transaction by id' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.userTransactionsService.findOne(+id, req.user.sub);
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user transactions' })
  findAllUserTransactions(@Request() req) {
    // console.log(req.user.sub);
    return this.userTransactionsService.findAllUserTransactions(req.user.sub);
  }
}
