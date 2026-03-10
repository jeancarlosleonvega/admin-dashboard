import { prisma } from '../../infrastructure/database/client.js';

export class WalletRepository {
  async findOrCreateWallet(userId: string) {
    let wallet = await prisma.userWallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.userWallet.create({ data: { userId, balance: 0 } });
    }
    return wallet;
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await prisma.userWallet.findUnique({ where: { userId } });
    return wallet ? parseFloat(wallet.balance.toString()) : 0;
  }

  async credit(
    userId: string,
    amount: number,
    referenceType?: string,
    referenceId?: string,
    description?: string,
  ) {
    const wallet = await this.findOrCreateWallet(userId);
    const [updatedWallet, tx] = await prisma.$transaction([
      prisma.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          description: description ?? null,
          referenceType: referenceType ?? null,
          referenceId: referenceId ?? null,
        },
      }),
    ]);
    return { wallet: updatedWallet, transaction: tx };
  }

  async debit(
    userId: string,
    amount: number,
    referenceType?: string,
    referenceId?: string,
    description?: string,
  ) {
    const wallet = await this.findOrCreateWallet(userId);
    const [updatedWallet, tx] = await prisma.$transaction([
      prisma.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          description: description ?? null,
          referenceType: referenceType ?? null,
          referenceId: referenceId ?? null,
        },
      }),
    ]);
    return { wallet: updatedWallet, transaction: tx };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await prisma.userWallet.findUnique({ where: { userId } });
    if (!wallet) return { items: [], total: 0 };

    const [items, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return { items, total };
  }
}

export const walletRepository = new WalletRepository();
