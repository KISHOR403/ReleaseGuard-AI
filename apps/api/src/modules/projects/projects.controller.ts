import { Controller, Get } from '@nestjs/common';
import { ProjectsService, ProjectSummary } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): ProjectSummary[] {
    return this.projectsService.findAll();
  }
}
