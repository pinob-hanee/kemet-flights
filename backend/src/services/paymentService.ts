import logger from '../utils/logger';

export interface PaymentDetails {
  bookingId: string;
  amount: number;
  currency: string;
  method: 'CARD' | 'PAYPAL' | 'WALLET';
  gateway: 'STRIPE' | 'PAYMOB' | 'WALLET_INTERNAL';
  token?: string;
}

export class PaymentService {
  /**
   * Process a payment mock with high security simulation.
   */
  public static async processPayment(details: PaymentDetails): Promise<{
    success: boolean;
    transactionId: string;
    gateway: string;
    amount: number;
    currency: string;
  }> {
    logger.info(`Initiating secure payment for booking: ${details.bookingId} via gateway: ${details.gateway}`);
    
    // Simulate slight network latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (details.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Simulate fraudulent card prevention (OWASP standard check)
    if (details.token === 'tok_fraudulent_card_decline') {
      logger.warn(`Fraud block triggered for transaction on booking ${details.bookingId}`);
      return {
        success: false,
        transactionId: `txn_failed_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        gateway: details.gateway,
        amount: details.amount,
        currency: details.currency,
      };
    }

    // Success generation
    const transactionId = `txn_${details.gateway.toLowerCase().substring(0, 3)}_${Math.random()
      .toString(36)
      .substring(2, 12)
      .toUpperCase()}`;

    logger.info(`Payment processed successfully. Transaction ID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      gateway: details.gateway,
      amount: details.amount,
      currency: details.currency,
    };
  }

  /**
   * Refunding payments.
   */
  public static async processRefund(
    paymentId: string,
    amount: number,
    gateway: string
  ): Promise<{ success: boolean; refundId: string }> {
    logger.info(`Processing refund for transaction: ${paymentId} with amount: ${amount}`);
    
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const refundId = `ref_${gateway.toLowerCase().substring(0, 3)}_${Math.random()
      .toString(36)
      .substring(2, 12)
      .toUpperCase()}`;

    logger.info(`Refund processed successfully. Refund ID: ${refundId}`);
    
    return {
      success: true,
      refundId,
    };
  }
}
export default PaymentService;
