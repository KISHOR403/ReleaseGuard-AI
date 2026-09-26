import { RepositoryIndexer } from '../src/indexer/repository-indexer';

describe('AST & Symbol Indexing', () => {
  const indexer = new RepositoryIndexer();

  const files = [
    {
      path: 'src/services/payment.service.ts',
      content: `
        export class PaymentService {
          charge(amount: number) {
            return amount > 0;
          }
        }
        export function helperCalculateFee(amount: number) {
          return amount * 0.03;
        }
        export interface PaymentReceipt {
          id: string;
        }
      `,
    },
    {
      path: 'src/controllers/payment.controller.ts',
      content: `
        function Controller(prefix: string) { return (target: any) => target; }
        function Post(path: string) { return (target: any, key: string) => target; }

        @Controller('/api/payments')
        export class PaymentController {
          @Post('charge')
          async processCharge() {
            return { ok: true };
          }
        }
      `,
    },
  ];

  const index = indexer.indexRepository(files);

  it('8. should detect TypeScript classes correctly', () => {
    const serviceFile = index.files.get('src/services/payment.service.ts');
    expect(serviceFile).toBeDefined();
    const classSym = serviceFile?.symbols.find((s) => s.kind === 'class' && s.name === 'PaymentService');
    expect(classSym).toBeDefined();
    expect(classSym?.exported).toBe(true);
  });

  it('9. should detect functions and interfaces', () => {
    const serviceFile = index.files.get('src/services/payment.service.ts');
    const funcSym = serviceFile?.symbols.find((s) => s.kind === 'function' && s.name === 'helperCalculateFee');
    const interfaceSym = serviceFile?.symbols.find((s) => s.kind === 'interface' && s.name === 'PaymentReceipt');
    expect(funcSym).toBeDefined();
    expect(interfaceSym).toBeDefined();
  });

  it('10. should detect controller routes with HTTP method and path', () => {
    const controllerFile = index.files.get('src/controllers/payment.controller.ts');
    expect(controllerFile).toBeDefined();
    const chargeRoute = controllerFile?.routes.find((r) => r.path === '/api/payments/charge');
    expect(chargeRoute).toBeDefined();
    expect(chargeRoute?.method).toBe('POST');
  });

  it('11. should map symbols to their defining source files in repository index', () => {
    const filesDefiningPaymentService = index.symbolsToFiles.get('PaymentService');
    expect(filesDefiningPaymentService).toBeDefined();
    expect(filesDefiningPaymentService?.has('src/services/payment.service.ts')).toBe(true);
  });
});
