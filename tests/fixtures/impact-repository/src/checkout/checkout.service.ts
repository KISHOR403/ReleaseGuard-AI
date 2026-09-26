import { OrderService } from '../order/order.service';

export class CheckoutService {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  async executeCheckout(cartId: string, total: number, currency: string) {
    const order = await this.orderService.createOrder(`ord_${cartId}`, total, currency);
    return { checkoutId: `chk_${Date.now()}`, order };
  }
}
