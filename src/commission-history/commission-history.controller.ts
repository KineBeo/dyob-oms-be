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
import { CommissionHistoryService } from './commission-history.service';
import { CreateCommissionHistoryDto } from './dto/create-commission-history.dto';
import { UpdateCommissionHistoryDto } from './dto/update-commission-history.dto';
import { AdminEndpoint } from 'src/auth/decorator/admin.decorator';
import { ProtectedEndpoint } from 'src/auth/decorator/authorization.decorator';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('commission-history')
@ApiTags('Commission History')
export class CommissionHistoryController {
  constructor(
    private readonly commissionHistoryService: CommissionHistoryService,
  ) {}

  @Post()
  @AdminEndpoint('Create a new commission history')
  create(@Body() createCommissionHistoryDto: CreateCommissionHistoryDto) {
    return this.commissionHistoryService.create(createCommissionHistoryDto);
  }

  @Get()
  @AdminEndpoint('Get all commission histories')
  findAll() {
    return this.commissionHistoryService.findAll();
  }

  @Get(':id')
  @ProtectedEndpoint('Get a commission history by id')
  findOne(@Param('id') id: number) {
    return this.commissionHistoryService.findOneByUserStatusId(+id);
  }

  @Get('monthly/:month/:year')
  @UseGuards(AdminGuard, JwtAuthGuard)
  @AdminEndpoint('Get all commission histories for a specific month and year')
  findAllByMonthAndYear(
    @Param('month') month: number,
    @Param('year') year: number,
  ) {
    return this.commissionHistoryService.findCommissionHistoryOfMonths(
      month,
      year,
    );
  }
}
