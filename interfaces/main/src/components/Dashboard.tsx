import { useWallet } from '@solana/wallet-adapter-react';
import { DollarSign, TrendingUp, Landmark, HandCoins, ArrowLeftRight, Wallet } from 'lucide-react';
import { StatCard } from './ui/Card';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { usePortfolioData } from '../hooks/usePortfolio';

export function Dashboard() {
  const { connected } = useWallet();
  const { totalValue, solBalance, loading } = useTokenBalance();
  const portfolio = usePortfolioData();

  if (!connected) {
    return (
      <div className="mb-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center glow-purple">
            <Wallet size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 gradient-text">Welcome to SolDeFi</h2>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto">
            Connect your Phantom or Solflare wallet to access swaps, staking, lending, bridging, and your full DeFi portfolio — all in one place.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Dashboard</h2>
          <p className="text-xs text-[var(--text-secondary)]">Your Solana DeFi overview</p>
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          Last updated: just now
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Value"
          value={loading ? '…' : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={portfolio.totalPnl !== 0 ? `${portfolio.totalPnl >= 0 ? '+' : ''}$${portfolio.totalPnl.toFixed(2)}` : undefined}
          changePositive={portfolio.totalPnl >= 0}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="SOL Balance"
          value={`${solBalance.toFixed(4)} SOL`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Staked Value"
          value={`$${portfolio.stakedValue.toLocaleString()}`}
          icon={<Landmark size={18} />}
        />
        <StatCard
          label="Lent / Borrowed"
          value={`$${portfolio.lentValue.toLocaleString()} / $${portfolio.borrowedValue.toLocaleString()}`}
          icon={<HandCoins size={18} />}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { label: 'Swap', href: '#swap', icon: ArrowLeftRight, color: 'from-purple-500/20 to-blue-500/20 border-purple-500/30' },
          { label: 'Stake', href: '#stake', icon: Landmark, color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30' },
          { label: 'Lend', href: '#lend', icon: HandCoins, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
          { label: 'Bridge', href: '#bridge', icon: TrendingUp, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${action.color} border text-sm font-medium hover:opacity-80 transition-opacity whitespace-nowrap`}
          >
            <action.icon size={16} />
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}
