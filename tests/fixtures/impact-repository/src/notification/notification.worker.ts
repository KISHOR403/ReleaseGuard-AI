import { CheckoutService } from '../checkout/checkout.service';

export class NotificationWorker {
  private checkoutService: CheckoutService;

  constructor() {
    this.checkoutService = new CheckoutService();
  }

  async processNotification(cartId: string, email: string) {
    const result = await this.checkoutService.executeCheckout(cartId, 100, 'USD');
    return { sent: true, email, result };
  }
}
