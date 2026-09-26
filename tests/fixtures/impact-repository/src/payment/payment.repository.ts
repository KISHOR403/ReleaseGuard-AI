export class PaymentRepository {
  async findById(id: string) {
    const query = "SELECT id, amount, currency, status FROM payments WHERE id = $1";
    return { id, query };
  }

  async savePayment(payment: { amount: number; currency: string; status: string }) {
    const query = "INSERT INTO payments (amount, currency, status) VALUES ($1, $2, $3)";
    return { ...payment, query };
  }
}
