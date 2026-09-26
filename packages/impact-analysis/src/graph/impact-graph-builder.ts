import {
  ImpactNode,
  ImpactEdge,
  Evidence,
  ApiImpact,
  DatabaseImpact,
  TestImpact,
} from '../schemas/impact-analysis.schema';
import { RepositoryIndex } from '../indexer/types';
import { TraversalResult } from '../analyzers/transitive-traversal';
import { DependencyAnalyzer } from '../analyzers/dependency-analyzer';

export interface GraphBuildResult {
  nodes: ImpactNode[];
  edges: ImpactEdge[];
  directNodes: ImpactNode[];
  transitiveNodes: ImpactNode[];
  affectedComponents: ImpactNode[];
}

export class ImpactGraphBuilder {
  private readonly depAnalyzer = new DependencyAnalyzer();

  buildImpactGraph(
    traversal: TraversalResult,
    index: RepositoryIndex,
    apis: ApiImpact[],
    database: DatabaseImpact[],
    tests: TestImpact[]
  ): GraphBuildResult {
    const nodeMap = new Map<string, ImpactNode>();
    const edgeMap = new Map<string, ImpactEdge>();

    // 1. Create FILE and COMPONENT nodes from traversal
    for (const [filePath, tNode] of traversal.nodesByPath.entries()) {
      const file = index.files.get(filePath);
      const fileId = `file:${filePath}`;
      const fileName = filePath.split('/').pop() || filePath;
      const criticality = this.determineCriticality(filePath);

      // Collect evidence for the file
      const fileEvidence: Evidence[] = [];
      if (tNode.directChanged) {
        fileEvidence.push({
          sourceType: 'FILE',
          filePath,
          description: `Directly changed file: ${filePath}`,
        });
      } else {
        for (const edge of tNode.incomingEdges) {
          fileEvidence.push(this.depAnalyzer.createImportEvidence(edge));
        }
      }

      const fileNode: ImpactNode = {
        id: fileId,
        type: 'FILE',
        name: fileName,
        path: filePath,
        directChanged: tNode.directChanged,
        impactDepth: tNode.depth,
        criticality,
        evidence: fileEvidence,
        confidence: 1.0,
      };
      nodeMap.set(fileId, fileNode);

      // Create COMPONENT nodes for symbols in this file
      if (file) {
        for (const sym of file.symbols) {
          if (['class', 'interface'].includes(sym.kind) || (sym.kind === 'function' && sym.exported)) {
            const symId = `symbol:${sym.name}`;
            const symNode: ImpactNode = {
              id: symId,
              type: 'COMPONENT',
              name: sym.name,
              path: filePath,
              directChanged: tNode.directChanged,
              impactDepth: tNode.depth,
              criticality,
              evidence: [
                {
                  sourceType: 'AST',
                  filePath,
                  lineStart: sym.line,
                  lineEnd: sym.line,
                  symbol: sym.name,
                  snippet: `${sym.kind} ${sym.name}`,
                  description: `${sym.kind} ${sym.name} declared in ${filePath}`,
                },
              ],
              confidence: 1.0,
            };
            nodeMap.set(symId, symNode);

            // Edge: File references / contains symbol
            const edgeId = `edge:contains:${fileId}->${symId}`;
            edgeMap.set(edgeId, {
              id: edgeId,
              source: fileId,
              target: symId,
              type: 'REFERENCES',
              direct: true,
              verified: true,
              confidence: 1.0,
              evidence: symNode.evidence,
            });
          }
        }
      }

      // Add IMPORTS edges for incoming edges
      for (const edge of tNode.incomingEdges) {
        const edgeId = `edge:import:file:${edge.source}->file:${edge.target}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: `file:${edge.source}`,
            target: `file:${edge.target}`,
            type: 'IMPORTS',
            direct: true,
            verified: true,
            confidence: 1.0,
            evidence: [this.depAnalyzer.createImportEvidence(edge)],
          });
        }
      }
    }

    // 2. Create API nodes and edges
    for (const api of apis) {
      const apiId = `api:${api.method}:${api.path}`;
      const apiNode: ImpactNode = {
        id: apiId,
        type: 'API',
        name: `${api.method} ${api.path}`,
        path: api.path,
        directChanged: api.changeType === 'BREAKING',
        impactDepth: 1,
        criticality: api.changeType === 'BREAKING' ? 'HIGH' : 'MEDIUM',
        evidence: [
          {
            sourceType: 'OPENAPI',
            description: `${api.changeType} API Contract: ${api.details}`,
            snippet: api.evidence?.currentSpec || api.evidence?.previousSpec,
          },
        ],
        confidence: api.confidence,
      };
      nodeMap.set(apiId, apiNode);

      for (const comp of api.affectedComponents) {
        const compId = `symbol:${comp.split('.')[0]}`;
        if (nodeMap.has(compId)) {
          const edgeId = `edge:api:${compId}->${apiId}`;
          edgeMap.set(edgeId, {
            id: edgeId,
            source: compId,
            target: apiId,
            type: 'IMPLEMENTS_API',
            direct: true,
            verified: true,
            confidence: 0.95,
            evidence: apiNode.evidence,
          });
        }
      }
    }

    // 3. Create DATABASE nodes and edges
    for (const db of database) {
      const dbNodeId = db.entityType === 'TABLE' ? `db:table:${db.name}` : `db:col:${db.name}`;
      const dbNode: ImpactNode = {
        id: dbNodeId,
        type: db.entityType === 'TABLE' ? 'DATABASE_TABLE' : 'DATABASE_COLUMN',
        name: db.name,
        directChanged: true,
        impactDepth: 0,
        criticality: 'HIGH',
        evidence: db.evidence,
        confidence: db.confidence,
      };
      nodeMap.set(dbNodeId, dbNode);

      for (const consumer of db.consumers) {
        const compId = `symbol:${consumer.component}`;
        if (nodeMap.has(compId)) {
          const edgeType =
            consumer.operation === 'WRITE'
              ? 'WRITES_TABLE'
              : consumer.operation === 'READ'
              ? 'READS_TABLE'
              : 'REFERENCES';
          const edgeId = `edge:db:${compId}->${dbNodeId}`;
          edgeMap.set(edgeId, {
            id: edgeId,
            source: compId,
            target: dbNodeId,
            type: edgeType,
            direct: true,
            verified: true,
            confidence: 0.95,
            evidence: [
              {
                sourceType: 'QUERY',
                filePath: consumer.filePath,
                lineStart: consumer.line,
                lineEnd: consumer.line,
                snippet: consumer.snippet,
                description: `${consumer.component} performs ${consumer.operation} on ${db.name}`,
              },
            ],
          });
        }
      }
    }

    // 4. Create TEST nodes and edges
    for (const test of tests) {
      const testId = `test:${test.testFile}`;
      const testNode: ImpactNode = {
        id: testId,
        type: 'TEST',
        name: test.testFile.split('/').pop() || test.testFile,
        path: test.testFile,
        directChanged: false,
        impactDepth: test.impactDepth,
        criticality: test.testType === 'E2E' ? 'HIGH' : 'LOW',
        evidence: test.evidence,
        confidence: test.confidence,
      };
      nodeMap.set(testId, testNode);

      // Connect test to target file or component
      if (test.targetPath) {
        const targetId = `file:${test.targetPath}`;
        if (nodeMap.has(targetId)) {
          const edgeId = `edge:test:${testId}->${targetId}`;
          const edgeEvidence: Evidence[] =
            test.evidence && test.evidence.length > 0
              ? test.evidence
              : [
                  {
                    sourceType: 'TEST',
                    filePath: test.testFile,
                    description: `Test ${test.testFile} covers ${test.targetPath}`,
                  },
                ];
          edgeMap.set(edgeId, {
            id: edgeId,
            source: testId,
            target: targetId,
            type: 'TESTS',
            direct: true,
            verified: test.relationship === 'VERIFIED_IMPORT',
            confidence: test.confidence,
            evidence: edgeEvidence,
          });
        }
      }
    }

    const allNodes = Array.from(nodeMap.values());
    const allEdges = Array.from(edgeMap.values());

    const directNodes = allNodes.filter((n) => n.directChanged || n.impactDepth === 0);
    const transitiveNodes = allNodes.filter((n) => !n.directChanged && n.impactDepth > 0);
    const affectedComponents = allNodes.filter((n) => n.type === 'COMPONENT');

    return {
      nodes: allNodes,
      edges: allEdges,
      directNodes,
      transitiveNodes,
      affectedComponents,
    };
  }

  private determineCriticality(filePath: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const lower = filePath.toLowerCase();
    if (
      lower.includes('payment') ||
      lower.includes('checkout') ||
      lower.includes('auth') ||
      lower.includes('billing') ||
      lower.includes('security')
    ) {
      return 'HIGH';
    }
    if (lower.includes('controller') || lower.includes('service') || lower.includes('api')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}
