import { DependencyGraph, FileDependencyEdge } from './dependency-analyzer';

export class ReverseDependencyAnalyzer {
  constructor(private readonly graph: DependencyGraph) {}

  getDirectConsumers(targetPath: string): FileDependencyEdge[] {
    return this.graph.reverse.get(targetPath) || [];
  }

  hasConsumers(targetPath: string): boolean {
    const consumers = this.graph.reverse.get(targetPath);
    return Boolean(consumers && consumers.length > 0);
  }

  getAllReverseEdges(): Map<string, FileDependencyEdge[]> {
    return this.graph.reverse;
  }
}
