import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AffiliateProfileService } from './affiliate-profile.service';
import { CreateAffiliateProfileDto } from './dto/create-affiliate-profile.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('affiliate')
@ApiTags('affiliate')
export class AffiliateProfileController {
  constructor(private readonly affiliateService: AffiliateProfileService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create affiliate' })  
  // create(@Body() createAffiliateDto: CreateAffiliateDto) {
  //   return this.affiliateService.create(createAffiliateDto);
  // }

  // @Get()
  // @ApiOperation({ summary: 'Get all affiliates' })
  // findAll() {
  //   return this.affiliateService.findAll();
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get affiliate by id' })
  // findOne(@Param('id') id: number) {
  //   return this.affiliateService.findOne(+id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update affiliate by id' })
  // update(@Param('id') id: number, @Body() updateAffiliateDto: UpdateAffiliateDto) {
  //   return this.affiliateService.update(+id, updateAffiliateDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete affiliate by id' })
  // remove(@Param('id') id: number) {
  //   return this.affiliateService.remove(+id);
  // }
  @Post()
  @ApiOperation({ summary: 'Create a new affiliate' })
  @ApiResponse({ status: 201, description: 'Affiliate successfully created' })
  create(@Body() createAffiliateDto: CreateAffiliateProfileDto) {
    return this.affiliateService.create(createAffiliateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all affiliates' })
  @ApiResponse({ status: 200, description: 'Return all affiliates' })
  findAll() {
    return this.affiliateService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get affiliate by ID' })
  @ApiResponse({ status: 200, description: 'Return affiliate by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.affiliateService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update affiliate by ID' })
  @ApiResponse({ status: 200, description: 'Affiliate successfully updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAffiliateDto: UpdateAffiliateDto,
  ) {
    return this.affiliateService.update(id, updateAffiliateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete affiliate by ID' })
  @ApiResponse({ status: 200, description: 'Affiliate successfully deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.affiliateService.remove(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get affiliate by user ID' })
  @ApiResponse({ status: 200, description: 'Return affiliate by user ID' })
  findByUserId(@Param('userId') userId: number) {
    return this.affiliateService.findAffiliateByUserId(userId);
  }

  // @Get('referral/:code')
  // @ApiOperation({ summary: 'Get affiliate by referral code' })
  // @ApiResponse({ status: 200, description: 'Return affiliate by referral code' })
  // findByReferralCode(@Param('code') code: string) {
  //   return this.affiliateService.findAffiliateByReferralCode(code);
  // }

  // @Post('check-rank/:id')
  // @ApiOperation({ summary: 'Check and update affiliate rank' })
  // @ApiResponse({ status: 200, description: 'Rank checked and updated if necessary' })
  // checkRank(@Param('id', ParseIntPipe) id: number) {
  //   return this.affiliateService.checkAndUpdateRank(id);
  // }
}
