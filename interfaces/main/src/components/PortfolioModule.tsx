import { useWallet } from '@solana/wallet-adapter-react';
import { PieChart, TrendingUp, TrendingDown, Wallet, Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, StatCard } from './ui/Card';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { usePortfolioData } from '../hooks/usePortfolio';

export function PortfolioModule() {
  const { connected } = useWallet();
  const { balances, totalValue, loading } = useTokenBalance();
  const portfolio = usePortfolioData();

  if (!connected) {
    return (
      <Card
        title="Portfolio"
        icon={<PieChart size={18} />}
        description="Your DeFi positions at a glance"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Wallet size={40} className="text-[var(--text-secondary)] opacity-30 mb-4" />
          <p className="text-sm text-[var(--text-secondary)]">
            Connect your wallet to view your portfolio
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Portfolio"
      icon={<PieChart size={18} />}
      description="Your DeFi positions at a glance"
      badge={
        <span className={portfolio.totalPnl >= 0 ? 'badge-green' : 'badge-red'}>
          {portfolio.totalPnl >= 0 ? '+' : ''}{portfolio.totalPnlPercent.toFixed(2)}%
        </span>
      }
    >
      <div className="space-y-4 pt-4">
        {/* Total value */}
        <div className="text-center py-3">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Total Portfolio Value</div>
          <div className="text-3xl font-bold">
            {loading ? (
              <span className="text-[var(--text-secondary)]">Loading…</span>
            ) : (
              `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          {portfolio.totalPnl !== 0 && (
            <div className={`flex items-center justify-center gap-1 mt-1 text-sm font-medium ${
              portfolio.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {portfolio.totalPnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {portfolio.totalPnl >= 0 ? '+' : ''}${portfolio.totalPnl.toFixed(2)}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
            <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Health</div>
            <div className="flex items-center justify-center gap-1">
              <Shield size={12} className="text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">{portfolio.healthScore}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
            <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Net APY</div>
            <div className="text-sm font-bold text-[var(--accent-purple)]">{portfolio.netApy}%</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
            <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">24h Vol</div>
            <div className="text-sm font-bold">${portfolio.swapVolume24h.toLocaleString()}</div>
          </div>
        </div>

        {/* Token holdings */}
        <div>
          <div className="text-xs text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wider">Holdings</div>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-6 text-sm text-[var(--text-secondary)]">
              No tokens found in wallet
            </div>
          ) : (
            <div className="space-y-1">
              {balances.slice(0, 8).map((b) => (
                <div
                  key={b.token.address}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  {b.token.logoURI ? (
                    <img
                      src={b.token.logoURI}
                      alt={b.token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-purple)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent-purple)]">
                      {b.token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{b.token.symbol}</div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">{b.token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{parseFloat(b.uiAmount).toFixed(4)}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {b.value > 0 ? `$${b.value.toFixed(2)}` : '—'}
                    </div>
                  </div>
                </div>
              ))}
              {balances.length > 8 && (
                <div className="text-center py-2 text-xs text-[var(--text-secondary)]">
                  +{balances.length - 8} more tokens
                </div>
              )}
            </div>
          )}
        </div>

        {/* Position breakdown placeholder */}
        <div>
          <div className="text-xs text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wider">Positions</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Staked', value: `$${portfolio.stakedValue.toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Lent', value: `$${portfolio.lentValue.toLocaleString()}`, color: 'text-blue-400' },
              { label: 'Borrowed', value: `$${portfolio.borrowedValue.toLocaleString()}`, color: 'text-amber-400' },
              { label: 'Swap Vol 24h', value: `$${portfolio.swapVolume24h.toLocaleString()}`, color: 'text-[var(--accent-purple)]' },
            ].map((item) => (
              <div key={item.label} className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div className="text-[10px] text-[var(--text-secondary)]">{item.label}</div>
                <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
