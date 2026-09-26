import { ApiImpact, ApiContractChangeType } from '../schemas/impact-analysis.schema';
import { RouteDefinition } from '../indexer/types';

interface OpenApiSchemaObject {
  type?: string;
  required?: string[];
  properties?: Record<string, OpenApiSchemaObject>;
  enum?: string[];
}

interface OpenApiParameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: OpenApiSchemaObject;
}

interface OpenApiOperation {
  summary?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OpenApiSchemaObject }>;
  };
  responses?: Record<string, {
    description?: string;
    content?: Record<string, { schema?: OpenApiSchemaObject }>;
  }>;
}

interface OpenApiSpec {
  openapi?: string;
  paths?: Record<string, Record<string, OpenApiOperation>>;
}

export class ApiContractAnalyzer {
  analyzeApiContracts(
    currentSpecInput: unknown,
    previousSpecInput: unknown,
    routes: RouteDefinition[] = []
  ): ApiImpact[] {
    const currentSpec = this.parseSpec(currentSpecInput);
    const previousSpec = this.parseSpec(previousSpecInput);

    if (!currentSpec && !previousSpec) {
      return [];
    }

    const impacts: ApiImpact[] = [];
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

    // If only currentSpec is present, document active endpoints
    if (currentSpec && !previousSpec) {
      if (!currentSpec.paths) return [];

      for (const [path, pathItem] of Object.entries(currentSpec.paths)) {
        for (const [method, op] of Object.entries(pathItem)) {
          if (!httpMethods.includes(method.toLowerCase())) continue;
          const upperMethod = method.toUpperCase();
          const components = this.findMatchingComponents(upperMethod, path, routes);

          impacts.push({
            method: upperMethod,
            path,
            changeType: 'NON_BREAKING',
            details: `Active API endpoint defined: ${op.summary || `${upperMethod} ${path}`}`,
            affectedComponents: components,
            evidence: {
              currentSpec: JSON.stringify(op).slice(0, 200),
            },
            confidence: 0.95,
          });
        }
      }
      return impacts;
    }

    const curPaths = currentSpec?.paths || {};
    const prevPaths = previousSpec?.paths || {};

    // 1. Check for removed endpoints (in previous but not current)
    for (const [path, prevPathItem] of Object.entries(prevPaths)) {
      const curPathItem = curPaths[path];

      for (const [method, prevOp] of Object.entries(prevPathItem)) {
        if (!httpMethods.includes(method.toLowerCase())) continue;
        const upperMethod = method.toUpperCase();

        if (!curPathItem || !curPathItem[method]) {
          const components = this.findMatchingComponents(upperMethod, path, routes);
          impacts.push({
            method: upperMethod,
            path,
            changeType: 'BREAKING',
            details: `Endpoint ${upperMethod} ${path} was removed from the API contract`,
            affectedComponents: components,
            evidence: {
              previousSpec: JSON.stringify(prevOp).slice(0, 200),
            },
            confidence: 1.0,
          });
        }
      }
    }

    // 2. Check for added or modified endpoints
    for (const [path, curPathItem] of Object.entries(curPaths)) {
      const prevPathItem = prevPaths[path];

      for (const [method, curOp] of Object.entries(curPathItem)) {
        if (!httpMethods.includes(method.toLowerCase())) continue;
        const upperMethod = method.toUpperCase();
        const prevOp = prevPathItem ? prevPathItem[method] : undefined;
        const components = this.findMatchingComponents(upperMethod, path, routes);

        if (!prevOp) {
          // New endpoint added
          impacts.push({
            method: upperMethod,
            path,
            changeType: 'NON_BREAKING',
            details: `New endpoint ${upperMethod} ${path} was added to the API contract`,
            affectedComponents: components,
            evidence: {
              currentSpec: JSON.stringify(curOp).slice(0, 200),
            },
            confidence: 0.95,
          });
          continue;
        }

        // Compare parameters, request body, responses
        const diffs = this.compareOperations(curOp, prevOp);
        if (diffs.length > 0) {
          const isBreaking = diffs.some((d) => d.breaking);
          const changeType: ApiContractChangeType = isBreaking ? 'BREAKING' : 'NON_BREAKING';
          const details = diffs.map((d) => d.message).join('; ');

          impacts.push({
            method: upperMethod,
            path,
            changeType,
            details,
            affectedComponents: components,
            evidence: {
              currentSpec: JSON.stringify(curOp).slice(0, 200),
              previousSpec: JSON.stringify(prevOp).slice(0, 200),
            },
            confidence: 0.98,
          });
        }
      }
    }

    return impacts;
  }

  private compareOperations(
    current: OpenApiOperation,
    previous: OpenApiOperation
  ): Array<{ breaking: boolean; message: string }> {
    const diffs: Array<{ breaking: boolean; message: string }> = [];

    // Compare parameters
    const prevParams = previous.parameters || [];
    const curParams = current.parameters || [];

    for (const curParam of curParams) {
      const prevParam = prevParams.find((p) => p.name === curParam.name && p.in === curParam.in);
      if (!prevParam && curParam.required) {
        diffs.push({
          breaking: true,
          message: `Required parameter '${curParam.name}' was added`,
        });
      } else if (prevParam && !prevParam.required && curParam.required) {
        diffs.push({
          breaking: true,
          message: `Parameter '${curParam.name}' changed from optional to required`,
        });
      }

      // Check enum removal
      if (prevParam?.schema?.enum && curParam?.schema?.enum) {
        const removedEnums = prevParam.schema.enum.filter((v) => !curParam.schema?.enum?.includes(v));
        if (removedEnums.length > 0) {
          diffs.push({
            breaking: true,
            message: `Enum value(s) '${removedEnums.join(', ')}' removed from parameter '${curParam.name}'`,
          });
        }
      }
    }

    // Compare request body
    const curBodySchema = current.requestBody?.content?.['application/json']?.schema;
    const prevBodySchema = previous.requestBody?.content?.['application/json']?.schema;

    if (curBodySchema && prevBodySchema) {
      const curReq = curBodySchema.required || [];
      const prevReq = prevBodySchema.required || [];
      const newRequired = curReq.filter((f) => !prevReq.includes(f));

      for (const field of newRequired) {
        diffs.push({
          breaking: true,
          message: `Required request body property '${field}' was added`,
        });
      }

      // Check property type change
      if (curBodySchema.properties && prevBodySchema.properties) {
        for (const [propName, prevProp] of Object.entries(prevBodySchema.properties)) {
          const curProp = curBodySchema.properties[propName];
          if (curProp && prevProp.type && curProp.type && prevProp.type !== curProp.type) {
            diffs.push({
              breaking: true,
              message: `Property '${propName}' in request body changed type from '${prevProp.type}' to '${curProp.type}'`,
            });
          }
        }
      }
    }

    // Compare response body
    const curRespSchema =
      current.responses?.['200']?.content?.['application/json']?.schema ||
      current.responses?.['201']?.content?.['application/json']?.schema;
    const prevRespSchema =
      previous.responses?.['200']?.content?.['application/json']?.schema ||
      previous.responses?.['201']?.content?.['application/json']?.schema;

    if (curRespSchema && prevRespSchema) {
      if (prevRespSchema.properties && curRespSchema.properties) {
        for (const propName of Object.keys(prevRespSchema.properties)) {
          if (!curRespSchema.properties[propName]) {
            diffs.push({
              breaking: true,
              message: `Response property '${propName}' was removed`,
            });
          }
        }

        for (const [propName, prevProp] of Object.entries(prevRespSchema.properties)) {
          const curProp = curRespSchema.properties[propName];
          if (curProp && prevProp.type && curProp.type && prevProp.type !== curProp.type) {
            diffs.push({
              breaking: true,
              message: `Response property '${propName}' changed type from '${prevProp.type}' to '${curProp.type}'`,
            });
          }
        }
      }
    }

    return diffs;
  }

  private findMatchingComponents(method: string, path: string, routes: RouteDefinition[]): string[] {
    const matched: string[] = [];
    for (const route of routes) {
      if (route.method.toUpperCase() === method.toUpperCase()) {
        const normalizedRoutePath = route.path.replace(/\/+/g, '/').toLowerCase();
        const normalizedApiPath = path.replace(/\/+/g, '/').toLowerCase();

        if (normalizedRoutePath === normalizedApiPath || normalizedApiPath.endsWith(normalizedRoutePath)) {
          if (route.handlerSymbol) {
            matched.push(route.handlerSymbol);
          }
        }
      }
    }
    return matched;
  }

  private parseSpec(input: unknown): OpenApiSpec | null {
    if (!input) return null;
    if (typeof input === 'string') {
      try {
        return JSON.parse(input) as OpenApiSpec;
      } catch {
        return null;
      }
    }
    if (typeof input === 'object') {
      return input as OpenApiSpec;
    }
    return null;
  }
}
