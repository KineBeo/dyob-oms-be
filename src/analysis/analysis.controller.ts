import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('analysis')
@ApiTags('Analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getAnalysisForUser(
    @Query('month') month: number,
    @Query('year') year: number,
    @Req() req,
  ) {
    return this.analysisService.getAnalysisForUser(month, year, req.user.sub);
  }
}
