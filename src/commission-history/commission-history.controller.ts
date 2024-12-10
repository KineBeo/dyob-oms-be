import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommissionHistoryService } from './commission-history.service';
import { CreateCommissionHistoryDto } from './dto/create-commission-history.dto';
import { UpdateCommissionHistoryDto } from './dto/update-commission-history.dto';
import { AdminEndpoint } from 'src/auth/decorator/admin.decorator';
import { ProtectedEndpoint } from 'src/auth/decorator/authorization.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('commission-history')
@ApiTags('Commission History')
export class CommissionHistoryController {
  constructor(private readonly commissionHistoryService: CommissionHistoryService) {}

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommissionHistoryDto: UpdateCommissionHistoryDto) {
    return this.commissionHistoryService.update(+id, updateCommissionHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commissionHistoryService.remove(+id);
  }
}
