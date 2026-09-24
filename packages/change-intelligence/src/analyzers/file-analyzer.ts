import * as path from 'path';

export type FileCategory =
  | 'frontend_component'
  | 'frontend_page'
  | 'frontend_hook'
  | 'frontend_style'
  | 'frontend_service'
  | 'backend_controller'
  | 'backend_route'
  | 'backend_service'
  | 'backend_repository'
  | 'backend_middleware'
  | 'backend_model'
  | 'test_unit'
  | 'test_integration'
  | 'test_e2e'
  | 'test_fixture'
  | 'test_utility'
  | 'infra_docker'
  | 'infra_k8s'
  | 'infra_terraform'
  | 'infra_cicd'
  | 'infra_config'
  | 'database_migration'
  | 'database_schema'
  | 'database_seed'
  | 'database_sql'
  | 'documentation'
  | 'unknown';

export interface FileClassification {
  path: string;
  extension: string;
  language: string;
  category: FileCategory;
  domainHint: string;
  isTest: boolean;
  isConfig: boolean;
  isDatabase: boolean;
  isApiRelated: boolean;
  isSecurityRelated: boolean;
}

export class FileAnalyzer {
  static analyze(filePath: string): FileClassification {
    const normalized = filePath.replace(/\\/g, '/');
    const ext = path.extname(normalized).toLowerCase();
    const basename = path.basename(normalized).toLowerCase();
    const language = this.detectLanguage(ext, basename);
    const category = this.detectCategory(normalized, basename, ext);
    const domainHint = this.extractDomainHint(normalized);

    const isTest = category.startsWith('test_');
    const isConfig = category.startsWith('infra_config') || category === 'infra_cicd' || this.isConfigFile(basename);
    const isDatabase = category.startsWith('database_');
    const isApiRelated = category === 'backend_controller' || category === 'backend_route' || category === 'frontend_service' || this.isApiFile(normalized);
    const isSecurityRelated = this.isSecurityFile(normalized);

    return {
      path: filePath,
      extension: ext,
      language,
      category,
      domainHint,
      isTest,
      isConfig,
      isDatabase,
      isApiRelated,
      isSecurityRelated,
    };
  }

  private static detectLanguage(ext: string, basename: string): string {
    if (ext === '.ts' || ext === '.tsx') return 'typescript';
    if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return 'javascript';
    if (ext === '.py') return 'python';
    if (ext === '.go') return 'go';
    if (ext === '.java') return 'java';
    if (ext === '.sql') return 'sql';
    if (ext === '.json') return 'json';
    if (ext === '.yaml' || ext === '.yml') return 'yaml';
    if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') return 'css';
    if (ext === '.md' || ext === '.mdx') return 'markdown';
    if (ext === '.html') return 'html';
    if (ext === '.tf' || ext === '.tfvars') return 'terraform';
    if (basename === 'dockerfile') return 'dockerfile';
    return ext ? ext.replace('.', '') : 'unknown';
  }

  private static detectCategory(p: string, base: string, ext: string): FileCategory {
    const lower = p.toLowerCase();

    // Testing
    if (lower.includes('/e2e/') || base.includes('.e2e-') || base.includes('.cy.') || lower.includes('playwright')) {
      return 'test_e2e';
    }
    if (lower.includes('integration') && (base.includes('.test.') || base.includes('.spec.'))) {
      return 'test_integration';
    }
    if (base.includes('.test.') || base.includes('.spec.') || lower.includes('/__tests__/')) {
      return 'test_unit';
    }
    if (lower.includes('fixture') || base.includes('.fixture.')) {
      return 'test_fixture';
    }
    if (lower.includes('test-util') || lower.includes('testing/')) {
      return 'test_utility';
    }

    // Database
    if (lower.includes('migration') || base.includes('migration')) {
      return 'database_migration';
    }
    if (base.includes('schema') || base.includes('prisma') || lower.includes('/schemas/')) {
      return 'database_schema';
    }
    if (base.includes('seed') || lower.includes('/seeds/')) {
      return 'database_seed';
    }
    if (ext === '.sql') {
      return 'database_sql';
    }

    // Infrastructure
    if (base === 'dockerfile' || base.startsWith('docker-compose') || base === '.dockerignore') {
      return 'infra_docker';
    }
    if (lower.startsWith('k8s/') || lower.includes('/k8s/') || lower.includes('/helm/') || base.includes('.k8s.')) {
      return 'infra_k8s';
    }
    if (ext === '.tf' || ext === '.tfvars') {
      return 'infra_terraform';
    }
    if (lower.includes('.github/') || lower.includes('.gitlab-ci') || base === 'jenkinsfile') {
      return 'infra_cicd';
    }
    if (
      base.startsWith('.env') ||
      base.includes('tsconfig') ||
      base.includes('eslint') ||
      base.includes('prettier') ||
      base.includes('package.json') ||
      base.includes('.config.')
    ) {
      return 'infra_config';
    }

    // Documentation
    if (ext === '.md' || ext === '.mdx' || lower.includes('/docs/')) {
      return 'documentation';
    }

    // Backend
    if (base.includes('controller') || lower.includes('/controllers/')) {
      return 'backend_controller';
    }
    if (base.includes('route') || lower.includes('/routes/') || lower.includes('app/api/')) {
      return 'backend_route';
    }
    if (base.includes('service') || lower.includes('/services/')) {
      return lower.includes('/web/') || lower.includes('/frontend/') ? 'frontend_service' : 'backend_service';
    }
    if (base.includes('repository') || lower.includes('/repositories/')) {
      return 'backend_repository';
    }
    if (base.includes('middleware') || lower.includes('/middleware/')) {
      return 'backend_middleware';
    }
    if (base.includes('model') || base.includes('entity') || lower.includes('/entities/') || lower.includes('/models/')) {
      return 'backend_model';
    }

    // Frontend
    if (lower.includes('/hooks/') || base.startsWith('use') && (ext === '.ts' || ext === '.tsx' || ext === '.js')) {
      return 'frontend_hook';
    }
    if (
      base.startsWith('page.') ||
      base.startsWith('layout.') ||
      lower.includes('/pages/') ||
      lower.includes('/app/') && (base.startsWith('page.') || base.startsWith('layout.'))
    ) {
      return 'frontend_page';
    }
    if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') {
      return 'frontend_style';
    }
    if (ext === '.tsx' || ext === '.jsx' || lower.includes('/components/')) {
      return 'frontend_component';
    }

    return 'unknown';
  }

  private static extractDomainHint(p: string): string {
    const parts = p.split('/').filter(Boolean);
    // Remove common prefix directories
    const ignored = new Set(['src', 'apps', 'packages', 'app', 'lib', 'modules', 'api', 'web']);
    for (const part of parts) {
      if (!ignored.has(part.toLowerCase()) && !part.includes('.')) {
        return part.toLowerCase();
      }
    }
    return 'general';
  }

  private static isConfigFile(base: string): boolean {
    return (
      base.startsWith('.env') ||
      base.endsWith('.config.js') ||
      base.endsWith('.config.ts') ||
      base.endsWith('.config.mjs') ||
      base === 'package.json' ||
      base.includes('tsconfig')
    );
  }

  private static isApiFile(p: string): boolean {
    const lower = p.toLowerCase();
    return lower.includes('controller') || lower.includes('route') || lower.includes('endpoint') || lower.includes('/api/');
  }

  private static isSecurityFile(p: string): boolean {
    const lower = p.toLowerCase();
    return (
      lower.includes('auth') ||
      lower.includes('security') ||
      lower.includes('permission') ||
      lower.includes('guard') ||
      lower.includes('token') ||
      lower.includes('jwt') ||
      lower.includes('password') ||
      lower.includes('secret')
    );
  }
}
