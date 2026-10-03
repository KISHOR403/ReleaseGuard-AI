import { PaymentRepository } from './payment.repository';

export class PaymentService {
  private repository: PaymentRepository;

  constructor() {
    this.repository = new PaymentRepository();
  }

  async processCharge(amount: number, currency: string, sourceToken: string) {
    if (amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    const payment = { amount, currency, sourceToken, status: 'succeeded' };
    await this.repository.savePayment(payment);
    return { transactionId: `tx_${Date.now()}`, status: payment.status };
  }

  async getTransactionStatus(transactionId: string) {
    return this.repository.findById(transactionId);
  }
}
