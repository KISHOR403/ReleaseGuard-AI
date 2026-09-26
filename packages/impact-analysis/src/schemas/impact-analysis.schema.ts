import { z } from 'zod';
import {
  ChangeAnalysisResultSchema,
  ChangeAnalysisResult,
} from '@releaseguard/change-intelligence';

export const EvidenceSourceTypeEnum = z.enum([
  'FILE',
  'AST',
  'IMPORT',
  'OPENAPI',
  'DATABASE',
  'QUERY',
  'TEST',
  'LLM',
]);
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeEnum>;

export const EvidenceSchema = z.object({
  sourceType: EvidenceSourceTypeEnum,
  filePath: z.string().optional(),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
  symbol: z.string().optional(),
  snippet: z.string().optional(),
  description: z.string().min(1),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const NodeTypeEnum = z.enum([
  'FILE',
  'SYMBOL',
  'COMPONENT',
  'API',
  'DATABASE_TABLE',
  'DATABASE_COLUMN',
  'TEST',
  'WORKFLOW',
]);
export type NodeType = z.infer<typeof NodeTypeEnum>;

export const EdgeTypeEnum = z.enum([
  'IMPORTS',
  'CALLS',
  'DEPENDS_ON',
  'IMPLEMENTS_API',
  'CONSUMES_API',
  'READS_TABLE',
  'WRITES_TABLE',
  'READS_COLUMN',
  'WRITES_COLUMN',
  'TESTS',
  'REFERENCES',
]);
export type EdgeType = z.infer<typeof EdgeTypeEnum>;

export const ImpactNodeSchema = z.object({
  id: z.string().min(1),
  type: NodeTypeEnum,
  name: z.string().min(1),
  path: z.string().optional(),
  directChanged: z.boolean(),
  impactDepth: z.number().int().nonnegative(),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  evidence: z.array(EvidenceSchema).default([]),
  confidence: z.number().min(0).max(1),
});
export type ImpactNode = z.infer<typeof ImpactNodeSchema>;

export const ImpactEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: EdgeTypeEnum,
  direct: z.boolean(),
  verified: z.boolean(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(EvidenceSchema).default([]),
});
export type ImpactEdge = z.infer<typeof ImpactEdgeSchema>;

export const ApiContractChangeTypeEnum = z.enum([
  'UNCHANGED',
  'NON_BREAKING',
  'POTENTIALLY_BREAKING',
  'BREAKING',
]);
export type ApiContractChangeType = z.infer<typeof ApiContractChangeTypeEnum>;

export const ApiImpactSchema = z.object({
  method: z.string().min(1),
  path: z.string().min(1),
  changeType: ApiContractChangeTypeEnum,
  details: z.string().min(1),
  affectedComponents: z.array(z.string()).default([]),
  evidence: z
    .object({
      currentSpec: z.string().optional(),
      previousSpec: z.string().optional(),
    })
    .optional(),
  confidence: z.number().min(0).max(1),
});
export type ApiImpact = z.infer<typeof ApiImpactSchema>;

export const DatabaseImpactSchema = z.object({
  entityType: z.enum(['TABLE', 'COLUMN', 'MIGRATION', 'MODEL']),
  name: z.string().min(1),
  tableName: z.string().optional(),
  changeType: z.enum(['ADDED', 'MODIFIED', 'DROPPED', 'REFERENCED']).optional(),
  consumers: z
    .array(
      z.object({
        component: z.string(),
        filePath: z.string(),
        operation: z.enum(['READ', 'WRITE', 'REFERENCE']),
        line: z.number().optional(),
        snippet: z.string().optional(),
      })
    )
    .default([]),
  evidence: z.array(EvidenceSchema).default([]),
  confidence: z.number().min(0).max(1),
});
export type DatabaseImpact = z.infer<typeof DatabaseImpactSchema>;

export const TestImpactSchema = z.object({
  testFile: z.string().min(1),
  testType: z.enum(['UNIT', 'INTEGRATION', 'E2E', 'UNKNOWN']),
  targetComponent: z.string().optional(),
  targetPath: z.string().optional(),
  relationship: z.enum(['VERIFIED_IMPORT', 'HEURISTIC_NAMING', 'API_ROUTE_MATCH']),
  impactDepth: z.number().int().nonnegative(),
  evidence: z.array(EvidenceSchema).default([]),
  confidence: z.number().min(0).max(1),
});
export type TestImpact = z.infer<typeof TestImpactSchema>;

export const UnknownImpactSchema = z.object({
  area: z.string().min(1),
  description: z.string().min(1),
  file: z.string().optional(),
});
export type UnknownImpact = z.infer<typeof UnknownImpactSchema>;

export const BlastRadiusBreakdownSchema = z.object({
  directNodes: z.number().int().nonnegative(),
  transitiveNodes: z.number().int().nonnegative(),
  maxDepth: z.number().int().nonnegative(),
  affectedApis: z.number().int().nonnegative(),
  breakingApis: z.number().int().nonnegative(),
  affectedDatabaseEntities: z.number().int().nonnegative(),
  affectedTests: z.number().int().nonnegative(),
  criticalComponents: z.number().int().nonnegative(),
});
export type BlastRadiusBreakdown = z.infer<typeof BlastRadiusBreakdownSchema>;

export const RepositoryFileSchema = z.object({
  path: z.string().min(1, 'File path cannot be empty'),
  content: z.string(),
  language: z.string().optional(),
});
export type RepositoryFile = z.infer<typeof RepositoryFileSchema>;

export const ImpactAnalysisInputSchema = z.object({
  changeAnalysisId: z.string().optional(),
  changeAnalysis: ChangeAnalysisResultSchema,
  repository: z
    .object({
      name: z.string().optional(),
      language: z.string().optional(),
      framework: z.string().optional(),
    })
    .optional(),
  repositorySnapshot: z.object({
    files: z.array(RepositoryFileSchema).min(1, 'At least one file in repository snapshot is required'),
  }),
  openApiSpec: z.unknown().optional(),
  previousOpenApiSpec: z.unknown().optional(),
  databaseSchema: z.unknown().optional(),
  previousDatabaseSchema: z.unknown().optional(),
  options: z
    .object({
      maxTraversalDepth: z.number().int().positive().default(5).optional(),
      weights: z.record(z.number()).optional(),
    })
    .optional(),
});
export type ImpactAnalysisInput = z.infer<typeof ImpactAnalysisInputSchema>;

export const ImpactAnalysisResultSchema = z.object({
  summary: z.string().min(1),
  blastRadiusScore: z.number().min(0).max(100),
  breakdown: BlastRadiusBreakdownSchema,
  directImpact: z.object({
    nodes: z.array(ImpactNodeSchema),
    count: z.number().int().nonnegative(),
  }),
  transitiveImpact: z.object({
    nodes: z.array(ImpactNodeSchema),
    count: z.number().int().nonnegative(),
    maxDepth: z.number().int().nonnegative(),
  }),
  affectedComponents: z.array(ImpactNodeSchema),
  affectedApis: z.array(ApiImpactSchema),
  affectedDatabase: z.array(DatabaseImpactSchema),
  affectedTests: z.array(TestImpactSchema),
  graph: z.object({
    nodes: z.array(ImpactNodeSchema),
    edges: z.array(ImpactEdgeSchema),
  }),
  unknowns: z.array(UnknownImpactSchema).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  confidence: z.number().min(0).max(1),
});
export type ImpactAnalysisResult = z.infer<typeof ImpactAnalysisResultSchema>;

export { ChangeAnalysisResult };
