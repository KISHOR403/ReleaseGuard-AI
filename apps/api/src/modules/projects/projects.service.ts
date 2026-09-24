import { Injectable } from '@nestjs/common';

export interface ProjectSummary {
  id: string;
  name: string;
  repository: string;
  status: 'active' | 'pending_setup';
}

@Injectable()
export class ProjectsService {
  /**
   * Returns registered projects.
   * Business logic and database persistence to be connected in subsequent milestones.
   */
  findAll(): ProjectSummary[] {
    return [];
  }
}
