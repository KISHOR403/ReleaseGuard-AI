import { PaymentService } from './payment.service';

export class ControllerDecoratorMock {}

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createCharge(body: { amount: number; currency: string; token: string }) {
    return this.paymentService.processCharge(body.amount, body.currency, body.token);
  }

  async getStatus(transactionId: string) {
    return this.paymentService.getTransactionStatus(transactionId);
  }
}
