import { DependencyGraph, FileDependencyEdge } from './dependency-analyzer';

export interface TraversalNode {
  filePath: string;
  depth: number;
  directChanged: boolean;
  incomingEdges: FileDependencyEdge[];
}

export interface TraversalResult {
  nodesByPath: Map<string, TraversalNode>;
  maxDepth: number;
  cyclicEdgesDetected: Array<{ from: string; to: string }>;
}

export class TransitiveTraversalEngine {
  traverseDownstreamImpact(
    changedFiles: string[],
    graph: DependencyGraph,
    maxDepth: number = 5
  ): TraversalResult {
    const nodesByPath = new Map<string, TraversalNode>();
    const cyclicEdgesDetected: Array<{ from: string; to: string }> = [];

    // Initialize root nodes (depth 0)
    const queue: Array<{ file: string; depth: number; ancestry: string[] }> = [];

    for (const changedFile of changedFiles) {
      nodesByPath.set(changedFile, {
        filePath: changedFile,
        depth: 0,
        directChanged: true,
        incomingEdges: [],
      });
      queue.push({ file: changedFile, depth: 0, ancestry: [changedFile] });
    }

    // BFS Traversal
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) {
        continue;
      }

      const consumers = graph.reverse.get(current.file) || [];

      for (const edge of consumers) {
        const consumerFile = edge.source;

        // Cycle check: If consumerFile is already in the current traversal ancestry path
        if (current.ancestry.includes(consumerFile)) {
          cyclicEdgesDetected.push({ from: current.file, to: consumerFile });
          continue;
        }

        const nextDepth = current.depth + 1;
        const existing = nodesByPath.get(consumerFile);

        if (!existing) {
          nodesByPath.set(consumerFile, {
            filePath: consumerFile,
            depth: nextDepth,
            directChanged: false,
            incomingEdges: [edge],
          });

          queue.push({
            file: consumerFile,
            depth: nextDepth,
            ancestry: [...current.ancestry, consumerFile],
          });
        } else {
          // If already encountered at a deeper depth, update to shorter depth
          if (nextDepth < existing.depth && !existing.directChanged) {
            existing.depth = nextDepth;
          }
          // Avoid duplicate incoming edges
          const exists = existing.incomingEdges.some(
            (e) => e.source === edge.source && e.target === edge.target && e.line === edge.line
          );
          if (!exists) {
            existing.incomingEdges.push(edge);
          }
        }
      }
    }

    let calculatedMaxDepth = 0;
    for (const node of nodesByPath.values()) {
      if (node.depth > calculatedMaxDepth) {
        calculatedMaxDepth = node.depth;
      }
    }

    return {
      nodesByPath,
      maxDepth: calculatedMaxDepth,
      cyclicEdgesDetected,
    };
  }
}
