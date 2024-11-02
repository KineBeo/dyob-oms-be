import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StrapiService } from './strapi.service';
import { CreateStrapiDto } from './dto/create-strapi.dto';
import { UpdateStrapiDto } from './dto/update-strapi.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/roles.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../enum/role';

@Controller('strapi')
@ApiTags('strapi')
export class StrapiController {
  constructor(private readonly strapiService: StrapiService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  async syncStrapi() {
    await this.strapiService.syncAll();
    return { message: 'Sync completed successfully' };
  }

  @Post()
  create(@Body() createStrapiDto: CreateStrapiDto) {
    return this.strapiService.create(createStrapiDto);
  } 

  @Get()
  findAll() {
    return this.strapiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.strapiService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStrapiDto: UpdateStrapiDto) {
    return this.strapiService.update(+id, updateStrapiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.strapiService.remove(+id);
  }
}
