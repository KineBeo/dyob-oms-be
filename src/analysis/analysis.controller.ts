import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
@ApiTags('Analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}
}
