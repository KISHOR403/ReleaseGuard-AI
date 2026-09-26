import { PaymentService } from '../src/payment/payment.service';

describe('PaymentService Unit Tests', () => {
  it('should process payment successfully', async () => {
    const service = new PaymentService();
    const res = await service.processCharge(100, 'USD', 'tok_test');
    expect(res.status).toBe('succeeded');
  });
});
