import { z } from 'zod';

export const ImpactLevelEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
  'UNKNOWN',
]);
export type ImpactLevel = z.infer<typeof ImpactLevelEnum>;

export const ChangeTypeEnum = z.enum([
  'FEATURE',
  'BUG_FIX',
  'REFACTOR',
  'CONFIGURATION',
  'DEPENDENCY',
  'DATABASE',
  'API',
  'SECURITY',
  'TEST',
  'DOCUMENTATION',
  'UNKNOWN',
]);
export type ChangeType = z.infer<typeof ChangeTypeEnum>;

export const ChangedFileSchema = z.object({
  path: z.string().min(1, 'File path cannot be empty'),
  status: z.enum(['added', 'modified', 'deleted', 'renamed']).default('modified'),
  additions: z.number().int().nonnegative().default(0),
  deletions: z.number().int().nonnegative().default(0),
  patch: z.string().optional(),
});
export type ChangedFile = z.infer<typeof ChangedFileSchema>;

export const ChangeAnalysisInputSchema = z.object({
  repository: z.string().min(1, 'Repository name is required'),
  repositoryUrl: z.string().url().optional(),
  baseBranch: z.string().default('main'),
  targetBranch: z.string().default('current'),
  commitSha: z.string().optional(),
  pullRequestNumber: z.number().int().positive().optional(),
  changedFiles: z.array(ChangedFileSchema).min(1, 'At least one changed file is required'),
  repositoryMetadata: z.record(z.unknown()).optional(),
  existingTests: z.array(z.string()).optional(),
});
export type ChangeAnalysisInput = z.infer<typeof ChangeAnalysisInputSchema>;

export const ChangedAreaSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  impact: ImpactLevelEnum,
});
export type ChangedArea = z.infer<typeof ChangedAreaSchema>;

export const AffectedApiSchema = z.object({
  method: z.string().min(1),
  path: z.string().min(1),
  sourceFile: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
export type AffectedApi = z.infer<typeof AffectedApiSchema>;

export const RiskIndicatorSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  evidence: z.array(z.string()).min(1, 'Every risk indicator must have evidence'),
  confidence: z.number().min(0).max(1),
});
export type RiskIndicator = z.infer<typeof RiskIndicatorSchema>;

export const TestImplicationSchema = z.object({
  changedFile: z.string().min(1),
  candidateTests: z.array(z.string()),
  recommendation: z.string().optional(),
});
export type TestImplication = z.infer<typeof TestImplicationSchema>;

export const ChangeAnalysisResultSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  changeType: ChangeTypeEnum,
  changedAreas: z.array(ChangedAreaSchema).default([]),
  affectedComponents: z.array(z.string()).default([]),
  affectedApis: z.array(AffectedApiSchema).default([]),
  riskIndicators: z.array(RiskIndicatorSchema).default([]),
  testImplications: z.array(TestImplicationSchema).default([]),
  confidence: z.number().min(0).max(1),
  unknowns: z.array(z.string()).default([]),
});
export type ChangeAnalysisResult = z.infer<typeof ChangeAnalysisResultSchema>;
