import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('analysis')
@ApiTags('Analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getAnalysisForUser(
    @Query('month') month: number,
    @Query('year') year: number,
    @Req() req,
  ) {
    return this.analysisService.getAnalysisForUser(month, year, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'start',
    required: true,
    example: '2021-01-01',
    type: Date,
  })
  @ApiQuery({ name: 'end', required: true, example: '2021-01-31', type: Date })
  async getAnalysis(@Query('start') start: Date, @Query('end') end: Date) {
    return this.analysisService.getAnalysisForAllUsers(start, end);
  }
}
