import {
  BlastRadiusBreakdown,
  ImpactNode,
  ApiImpact,
  DatabaseImpact,
  TestImpact,
} from '../schemas/impact-analysis.schema';
import { BlastRadiusWeights, DEFAULT_BLAST_RADIUS_WEIGHTS } from '../schemas/blast-radius-weights';

export class BlastRadiusCalculator {
  calculateScore(
    directNodes: ImpactNode[],
    transitiveNodes: ImpactNode[],
    maxDepth: number,
    apis: ApiImpact[],
    database: DatabaseImpact[],
    tests: TestImpact[],
    customWeights?: Partial<BlastRadiusWeights>
  ): { score: number; breakdown: BlastRadiusBreakdown } {
    const weights: BlastRadiusWeights = {
      ...DEFAULT_BLAST_RADIUS_WEIGHTS,
      ...customWeights,
    };

    const breakingApis = apis.filter((a) => a.changeType === 'BREAKING').length;
    const criticalComponents = [...directNodes, ...transitiveNodes].filter(
      (n) => n.criticality === 'HIGH'
    ).length;

    const breakdown: BlastRadiusBreakdown = {
      directNodes: directNodes.length,
      transitiveNodes: transitiveNodes.length,
      maxDepth,
      affectedApis: apis.length,
      breakingApis,
      affectedDatabaseEntities: database.length,
      affectedTests: tests.length,
      criticalComponents,
    };

    // Calculate raw weighted impact sum
    const rawScore =
      breakdown.directNodes * weights.directNodeWeight +
      breakdown.transitiveNodes * weights.transitiveNodeWeight +
      breakdown.maxDepth * weights.maxDepthWeight +
      breakdown.affectedApis * weights.affectedApiWeight +
      breakdown.breakingApis * weights.breakingApiWeight +
      breakdown.affectedDatabaseEntities * weights.affectedDatabaseEntityWeight +
      breakdown.affectedTests * weights.affectedTestWeight +
      breakdown.criticalComponents * weights.criticalComponentWeight;

    // Normalization to 0-100 scale using continuous asymptotic saturation
    // 0 points -> 0 score; ~50 raw -> ~45 score; ~100 raw -> ~70 score; ~200 raw -> ~92 score
    const normalized = Math.min(100, Math.round(100 * (1 - Math.exp(-rawScore / 85))));

    return {
      score: Math.max(0, normalized),
      breakdown,
    };
  }
}
