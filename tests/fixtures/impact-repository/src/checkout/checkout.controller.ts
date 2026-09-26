import { CheckoutService } from './checkout.service';

export class CheckoutController {
  private checkoutService: CheckoutService;

  constructor() {
    this.checkoutService = new CheckoutService();
  }

  async handleCheckout(cartId: string, total: number, currency: string) {
    return this.checkoutService.executeCheckout(cartId, total, currency);
  }
}
