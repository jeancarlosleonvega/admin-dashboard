import { usePageHeader } from '@/hooks/usePageHeader';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '@api/wallet.api';
import { Spinner } from '@components/ui/Spinner';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

function formatAmount(amount: number) {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyWalletPage() {
  usePageHeader({ subtitle: 'Tu saldo y movimientos' });

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: () => walletApi.getMyWallet(),
  });

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['my-wallet-transactions'],
    queryFn: () => walletApi.getMyTransactions(1, 50),
  });

  const transactions = txData?.data ?? [];

  return (
    <div className="max-w-lg space-y-4">
      {/* Balance */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wallet className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo disponible</p>
            {loadingWallet ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                {formatAmount(wallet?.balance ?? 0)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Movimientos */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Historial de movimientos</h3>
        </div>

        {loadingTx ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No hay movimientos registrados
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              return (
                <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.description ?? (isCredit ? 'Crédito' : 'Débito')}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>

                  <span
                    className={`text-sm font-semibold flex-shrink-0 ${isCredit ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isCredit ? '+' : '-'}{formatAmount(tx.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
