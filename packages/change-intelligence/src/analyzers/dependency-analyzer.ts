import * as path from 'path';
import { RiskIndicator } from '../schemas/change-analysis.schema';

export interface DependencyAnalysisResult {
  isDependencyFile: boolean;
  fileType: string;
  addedDependencies: string[];
  removedDependencies: string[];
  versionChanges: { package: string; from?: string; to?: string }[];
  riskIndicators: RiskIndicator[];
}

export class DependencyAnalyzer {
  private static readonly DEPENDENCY_FILES = new Set([
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'requirements.txt',
    'pom.xml',
    'build.gradle',
    'cargo.toml',
    'go.mod',
  ]);

  private static readonly SENSITIVE_PACKAGES = new Set([
    'jsonwebtoken',
    'bcrypt',
    'bcryptjs',
    'crypto',
    'passport',
    'helmet',
    'cors',
    'express-jwt',
    'stripe',
    'pg',
    'mysql2',
    'typeorm',
    'prisma',
    '@prisma/client',
  ]);

  static analyze(filePath: string, patch?: string): DependencyAnalysisResult {
    const filename = path.basename(filePath).toLowerCase();
    const isDep = this.DEPENDENCY_FILES.has(filename);

    if (!isDep) {
      return {
        isDependencyFile: false,
        fileType: 'none',
        addedDependencies: [],
        removedDependencies: [],
        versionChanges: [],
        riskIndicators: [],
      };
    }

    if (filename !== 'package.json' || !patch) {
      return {
        isDependencyFile: true,
        fileType: filename,
        addedDependencies: [],
        removedDependencies: [],
        versionChanges: [],
        riskIndicators:
          filename.includes('lock') || filename === 'requirements.txt'
            ? [
                {
                  type: 'DEPENDENCY_LOCKFILE_UPDATE',
                  description: `Lockfile ${filename} was updated.`,
                  evidence: [filePath],
                  confidence: 0.85,
                },
              ]
            : [],
      };
    }

    // Parse package.json diff lines
    const addedMap = new Map<string, string>();
    const removedMap = new Map<string, string>();
    const depPattern = /"([@a-zA-Z0-9_/-]+)"\s*:\s*"([^"]+)"/;

    const lines = patch.split('\n');
    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---')) continue;

      if (line.startsWith('+')) {
        const match = line.match(depPattern);
        if (match) {
          addedMap.set(match[1], match[2]);
        }
      } else if (line.startsWith('-')) {
        const match = line.match(depPattern);
        if (match) {
          removedMap.set(match[1], match[2]);
        }
      }
    }

    const versionChanges: { package: string; from?: string; to?: string }[] = [];
    const addedDependencies: string[] = [];
    const removedDependencies: string[] = [];
    const riskIndicators: RiskIndicator[] = [];

    // Find version changes vs new additions
    for (const [pkg, newVer] of addedMap.entries()) {
      if (removedMap.has(pkg)) {
        const oldVer = removedMap.get(pkg);
        versionChanges.push({ package: pkg, from: oldVer, to: newVer });

        // Check if major version bump (e.g. ^1.2.0 -> ^2.0.0)
        const oldMajor = oldVer?.replace(/[^0-9]/, '').split('.')[0];
        const newMajor = newVer?.replace(/[^0-9]/, '').split('.')[0];
        if (oldMajor && newMajor && oldMajor !== newMajor) {
          riskIndicators.push({
            type: 'DEPENDENCY_MAJOR_UPGRADE',
            description: `Major version upgrade for ${pkg} (${oldVer} -> ${newVer}). Potential breaking changes.`,
            evidence: [filePath, `"${pkg}": "${oldVer}" -> "${newVer}"`],
            confidence: 0.9,
          });
        }
      } else {
        addedDependencies.push(`${pkg}@${newVer}`);
        if (this.SENSITIVE_PACKAGES.has(pkg)) {
          riskIndicators.push({
            type: 'SENSITIVE_DEPENDENCY_ADDED',
            description: `Sensitive security, database, or payment package added: ${pkg}@${newVer}`,
            evidence: [filePath, `+"${pkg}": "${newVer}"`],
            confidence: 0.92,
          });
        }
      }
    }

    for (const [pkg, oldVer] of removedMap.entries()) {
      if (!addedMap.has(pkg)) {
        removedDependencies.push(`${pkg}@${oldVer}`);
        riskIndicators.push({
          type: 'DEPENDENCY_REMOVAL',
          description: `Dependency ${pkg}@${oldVer} was removed. Verify no orphaned imports remain.`,
          evidence: [filePath, `-"${pkg}": "${oldVer}"`],
          confidence: 0.88,
        });
      }
    }

    return {
      isDependencyFile: true,
      fileType: 'package.json',
      addedDependencies,
      removedDependencies,
      versionChanges,
      riskIndicators,
    };
  }
}
