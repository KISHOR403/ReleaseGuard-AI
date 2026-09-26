export interface BlastRadiusWeights {
  directNodeWeight: number;
  transitiveNodeWeight: number;
  maxDepthWeight: number;
  affectedApiWeight: number;
  breakingApiWeight: number;
  affectedDatabaseEntityWeight: number;
  affectedTestWeight: number;
  criticalComponentWeight: number;
}

export const DEFAULT_BLAST_RADIUS_WEIGHTS: BlastRadiusWeights = {
  directNodeWeight: 5.0,
  transitiveNodeWeight: 2.5,
  maxDepthWeight: 3.0,
  affectedApiWeight: 6.0,
  breakingApiWeight: 15.0,
  affectedDatabaseEntityWeight: 8.0,
  affectedTestWeight: 1.5,
  criticalComponentWeight: 10.0,
};
