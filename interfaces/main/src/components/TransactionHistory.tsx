import { useWallet } from '@solana/wallet-adapter-react';
import { History, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';
import { useTransactionHistory } from '../hooks/usePortfolio';

const TYPE_LABELS: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
  swap: { label: 'Swap', color: 'badge-blue', icon: RefreshCw },
  stake: { label: 'Stake', color: 'badge-green', icon: ArrowDownLeft },
  unstake: { label: 'Unstake', color: 'badge-amber', icon: ArrowUpRight },
  lend: { label: 'Supply', color: 'badge-green', icon: ArrowDownLeft },
  borrow: { label: 'Borrow', color: 'badge-amber', icon: ArrowUpRight },
  repay: { label: 'Repay', color: 'badge-blue', icon: ArrowDownLeft },
  bridge: { label: 'Bridge', color: 'badge-blue', icon: RefreshCw },
  transfer: { label: 'Transfer', color: 'badge-blue', icon: ArrowUpRight },
  unknown: { label: 'Transaction', color: 'badge-blue', icon: RefreshCw },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export function TransactionHistory() {
  const { connected } = useWallet();
  const { transactions, loading, refetch } = useTransactionHistory();

  if (!connected) {
    return (
      <Card
        title="Transaction History"
        icon={<History size={18} />}
        description="Recent wallet activity"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History size={40} className="text-[var(--text-secondary)] opacity-30 mb-4" />
          <p className="text-sm text-[var(--text-secondary)]">
            Connect your wallet to see transaction history
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Transaction History"
      icon={<History size={18} />}
      description="Recent wallet activity"
      headerRight={
        <button
          onClick={refetch}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <RefreshCw size={14} className={`text-[var(--text-secondary)] ${loading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="pt-4">
        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[var(--accent-purple)]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
            No transactions found
          </div>
        ) : (
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {transactions.map((tx) => {
              const info = TYPE_LABELS[tx.type] || TYPE_LABELS.unknown;
              const Icon = info.icon;
              return (
                <a
                  key={tx.signature}
                  href={tx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.status === 'failed' ? 'bg-red-500/10' : 'bg-[var(--accent-purple)]/10'
                  }`}>
                    <Icon size={14} className={tx.status === 'failed' ? 'text-red-400' : 'text-[var(--accent-purple)]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${info.color}`}>{info.label}</span>
                      {tx.status === 'failed' && <span className="badge badge-red">Failed</span>}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                      {tx.signature.slice(0, 12)}…{tx.signature.slice(-6)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-[var(--text-secondary)]">{timeAgo(tx.timestamp)}</div>
                    <ExternalLink size={10} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-0.5" />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
