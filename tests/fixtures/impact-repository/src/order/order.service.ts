import { PaymentService } from '../payment/payment.service';

export class OrderService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createOrder(orderId: string, amount: number, currency: string) {
    const payment = await this.paymentService.processCharge(amount, currency, 'token_default');
    return { orderId, status: 'PAID', paymentId: payment.transactionId };
  }
}
