import { walletRepository } from './wallet.repository.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class WalletService {
  async getBalance(userId: string): Promise<number> {
    return walletRepository.getBalance(userId);
  }

  async getWalletInfo(userId: string) {
    const wallet = await walletRepository.findOrCreateWallet(userId);
    return {
      balance: parseFloat(wallet.balance.toString()),
      updatedAt: wallet.updatedAt,
    };
  }

  async credit(
    userId: string,
    amount: number,
    referenceType?: string,
    referenceId?: string,
    description?: string,
  ) {
    if (amount <= 0) throw new ValidationError('El monto debe ser mayor a cero');
    return walletRepository.credit(userId, amount, referenceType, referenceId, description);
  }

  async debit(
    userId: string,
    amount: number,
    referenceType?: string,
    referenceId?: string,
    description?: string,
  ) {
    if (amount <= 0) throw new ValidationError('El monto debe ser mayor a cero');
    const balance = await walletRepository.getBalance(userId);
    if (balance < amount) throw new ValidationError('Saldo insuficiente en wallet');
    return walletRepository.debit(userId, amount, referenceType, referenceId, description);
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const { items, total } = await walletRepository.getTransactions(userId, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const walletService = new WalletService();
