import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('affiliate')
@ApiTags('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Post()
  @ApiOperation({ summary: 'Create affiliate' })  
  create(@Body() createAffiliateDto: CreateAffiliateDto) {
    return this.affiliateService.create(createAffiliateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all affiliates' })
  findAll() {
    return this.affiliateService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get affiliate by id' })
  findOne(@Param('id') id: number) {
    return this.affiliateService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update affiliate by id' })
  update(@Param('id') id: number, @Body() updateAffiliateDto: UpdateAffiliateDto) {
    return this.affiliateService.update(+id, updateAffiliateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete affiliate by id' })
  remove(@Param('id') id: number) {
    return this.affiliateService.remove(+id);
  }
}
