import { Navigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '@api/wallet.api';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDateTime } from '@lib/formatDate';

function formatAmount(amount: number) {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MyWalletPage() {
  usePageHeader({});
  const { user } = useAuthStore();

  if (!user?.walletEnabled) {
    return <Navigate to="/bookings/my" replace />;
  }

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
    <div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pb-6">
          <DetailSection title="Saldo" description="Crédito disponible en tu wallet.">
            {loadingWallet ? (
              <Spinner size="sm" />
            ) : (
              <div>
                <label className="label">Saldo disponible</label>
                <input
                  type="text"
                  className="input bg-gray-50 text-lg font-semibold"
                  value={formatAmount(wallet?.balance ?? 0)}
                  readOnly
                />
              </div>
            )}
          </DetailSection>

          <DetailSection title="Movimientos" description="Historial de acreditaciones y débitos." noBorder>
            {loadingTx ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No hay movimientos registrados
              </div>
            ) : (
              <div className="divide-y divide-gray-100 -mx-1">
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'CREDIT';
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-1 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isCredit
                          ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          : <ArrowUpRight className="w-4 h-4 text-red-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tx.description ?? (isCredit ? 'Crédito' : 'Débito')}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                      </div>
                      <span className={`text-sm font-semibold flex-shrink-0 ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}{formatAmount(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
