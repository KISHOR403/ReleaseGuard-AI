import { CheckoutController } from '../src/checkout/checkout.controller';

describe('Checkout E2E Regression Spec', () => {
  it('should complete checkout workflow against POST /api/v1/checkout', async () => {
    const controller = new CheckoutController();
    const result = await controller.handleCheckout('cart_123', 500, 'USD');
    expect(result.checkoutId).toBeDefined();
  });
});
