import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { env } from '../../config/env.js';
import { logger } from '../utils/logger.js';

function createClient() {
  if (!env.MP_ACCESS_TOKEN) return null;
  return new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
}

const client = createClient();

export const mpService = {
  isConfigured(): boolean {
    return !!client;
  },

  async createSubscription(data: {
    planName: string;
    amount: number;
    payerEmail: string;
    backUrl: string;
    externalReference: string;
  }): Promise<{ id: string; initPoint: string }> {
    if (!client) throw new Error('MercadoPago no está configurado');

    const preApproval = new PreApproval(client);
    const result = await preApproval.create({
      body: {
        reason: data.planName,
        payer_email: data.payerEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: data.amount,
          currency_id: 'ARS',
        },
        back_url: data.backUrl,
        external_reference: data.externalReference,
        status: 'pending',
      },
    });

    if (!result.id || !result.init_point) {
      throw new Error('Respuesta inválida de MercadoPago');
    }

    return { id: result.id, initPoint: result.init_point };
  },

  async getSubscription(subscriptionId: string) {
    if (!client) throw new Error('MercadoPago no está configurado');
    const preApproval = new PreApproval(client);
    return preApproval.get({ id: subscriptionId });
  },

  async cancelSubscription(subscriptionId: string) {
    if (!client) return;
    try {
      const preApproval = new PreApproval(client);
      await preApproval.update({
        id: subscriptionId,
        body: { status: 'cancelled' },
      });
    } catch (err) {
      logger.error({ err, subscriptionId }, 'Error al cancelar suscripción en MP');
    }
  },
};
