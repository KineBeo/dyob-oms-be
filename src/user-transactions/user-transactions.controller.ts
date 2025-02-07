import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserTransactionsService } from './user-transactions.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/enum/role';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user-transactions')
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
  findOne(@Param('id') id: string) {
    return this.userTransactionsService.findOne(+id);
  }
}
