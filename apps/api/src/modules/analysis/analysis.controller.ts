import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AnalysisService, AnalysisResponse } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('change')
  async analyzeChange(@Body() payload: unknown): Promise<AnalysisResponse> {
    return this.analysisService.analyzeChange(payload);
  }

  @Get('change/:id')
  async getAnalysis(@Param('id') id: string) {
    return this.analysisService.getAnalysisById(id);
  }

  @Post('impact')
  async analyzeImpact(@Body() payload: unknown) {
    return this.analysisService.analyzeImpact(payload);
  }

  @Get('impact/:id')
  async getImpact(@Param('id') id: string) {
    return this.analysisService.getAnalysisById(id);
  }
}
