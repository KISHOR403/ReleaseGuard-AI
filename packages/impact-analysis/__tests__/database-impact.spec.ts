import { RepositoryIndexer } from '../src/indexer/repository-indexer';
import { DatabaseImpactAnalyzer } from '../src/analyzers/database-impact-analyzer';

describe('DatabaseImpactAnalyzer', () => {
  const indexer = new RepositoryIndexer();
  const dbAnalyzer = new DatabaseImpactAnalyzer();

  const files = [
    {
      path: 'db/migrations/001_payments.sql',
      content: 'ALTER TABLE payments ADD COLUMN currency VARCHAR(3);',
    },
    {
      path: 'src/payment/payment.repository.ts',
      content: `
        export class PaymentRepository {
          async find() {
            return "SELECT id, amount, currency FROM payments";
          }
        }
      `,
    },
    {
      path: 'prisma/schema.prisma',
      content: `
        model Payment {
          id Int @id
          amount Float
          currency String
        }
      `,
    },
  ];

  const index = indexer.indexRepository(files);
  const impacts = dbAnalyzer.analyzeDatabaseImpact(['db/migrations/001_payments.sql'], index);

  it('18. should detect changed table from SQL migration', () => {
    const tableImpact = impacts.find((i) => i.entityType === 'TABLE' && i.name === 'payments');
    expect(tableImpact).toBeDefined();
    expect(tableImpact?.changeType).toBe('MODIFIED');
  });

  it('19. should detect changed column', () => {
    const colImpact = impacts.find((i) => i.entityType === 'COLUMN' && i.name === 'payments.currency');
    expect(colImpact).toBeDefined();
    expect(colImpact?.changeType).toBe('ADDED');
  });

  it('20. should detect SQL query consumer referencing payments table', () => {
    const tableImpact = impacts.find((i) => i.entityType === 'TABLE' && i.name === 'payments');
    expect(tableImpact?.consumers.length).toBeGreaterThanOrEqual(1);
    const consumer = tableImpact?.consumers.find((c) => c.filePath === 'src/payment/payment.repository.ts');
    expect(consumer).toBeDefined();
    expect(consumer?.operation).toBe('READ');
  });

  it('21. should index Prisma models as database entities', () => {
    expect(index.tables.has('payments')).toBe(true);
    const tableInfo = index.tables.get('payments');
    expect(tableInfo?.columns.has('currency')).toBe(true);
  });
});
