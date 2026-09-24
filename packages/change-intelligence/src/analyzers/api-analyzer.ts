import { AffectedApi } from '../schemas/change-analysis.schema';

export interface ApiDetectionResult {
  detectedApis: AffectedApi[];
  unknowns: string[];
}

export class ApiAnalyzer {
  static analyzeFile(filePath: string, patch?: string): ApiDetectionResult {
    const apis: AffectedApi[] = [];
    const unknowns: string[] = [];

    if (!patch) {
      return { detectedApis: apis, unknowns };
    }

    const normalizedPath = filePath.replace(/\\/g, '/');

    // 1. NestJS Controller Pattern
    const controllerPrefixMatch = patch.match(/@Controller\s*\(\s*['"]([^'"]*)['"]\s*\)/);
    const baseRoute = controllerPrefixMatch ? controllerPrefixMatch[1] : '';

    const nestDecorators = [
      { decorator: 'Get', method: 'GET' },
      { decorator: 'Post', method: 'POST' },
      { decorator: 'Put', method: 'PUT' },
      { decorator: 'Patch', method: 'PATCH' },
      { decorator: 'Delete', method: 'DELETE' },
    ];

    for (const { decorator, method } of nestDecorators) {
      const regex = new RegExp(`@${decorator}\\s*\\(\\s*(?:['"]([^'"]*)['"])?\\s*\\)`, 'g');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(patch)) !== null) {
        const subRoute = match[1] || '';
        let fullPath = '';
        if (baseRoute) {
          const cleanBase = baseRoute.startsWith('/') ? baseRoute : `/${baseRoute}`;
          const cleanSub = subRoute ? (subRoute.startsWith('/') ? subRoute : `/${subRoute}`) : '';
          fullPath = `${cleanBase}${cleanSub}`.replace(/\/+/g, '/');
        } else if (subRoute) {
          fullPath = subRoute.startsWith('/') ? subRoute : `/${subRoute}`;
        } else {
          fullPath = '/';
        }

        apis.push({
          method,
          path: fullPath,
          sourceFile: filePath,
          confidence: 0.94,
        });
      }
    }

    // 2. Express Route Pattern: (app|router).(get|post|put|patch|delete)('/path', ...)
    const expressPattern = /(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi;
    let expressMatch: RegExpExecArray | null;
    while ((expressMatch = expressPattern.exec(patch)) !== null) {
      const method = expressMatch[1].toUpperCase();
      const pathVal = expressMatch[2];
      apis.push({
        method,
        path: pathVal.startsWith('/') ? pathVal : `/${pathVal}`,
        sourceFile: filePath,
        confidence: 0.92,
      });
    }

    // 3. Next.js App Router (app/api/.../route.ts)
    if (normalizedPath.includes('/api/') && normalizedPath.endsWith('route.ts')) {
      const apiPathIndex = normalizedPath.indexOf('/api/');
      const routePath = normalizedPath
        .slice(apiPathIndex)
        .replace(/\/route\.ts$/, '');

      const nextMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      for (const m of nextMethods) {
        const nextRegex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b`);
        if (nextRegex.test(patch)) {
          apis.push({
            method: m,
            path: routePath,
            sourceFile: filePath,
            confidence: 0.95,
          });
        }
      }
    }

    // Unknowns / Ambiguous route changes
    if (normalizedPath.includes('controller') || normalizedPath.includes('route')) {
      if (apis.length === 0 && (patch.includes('http') || patch.includes('endpoint') || patch.includes('request'))) {
        unknowns.push(
          `Potential API route changes detected in ${filePath}, but endpoint pattern could not be deterministically resolved.`
        );
      }
    }

    // Deduplicate APIs by method + path + sourceFile
    const uniqueMap = new Map<string, AffectedApi>();
    for (const api of apis) {
      const key = `${api.method}:${api.path}:${api.sourceFile}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, api);
      }
    }

    return {
      detectedApis: Array.from(uniqueMap.values()),
      unknowns,
    };
  }
}
