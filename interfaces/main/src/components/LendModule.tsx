import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { HandCoins, TrendingUp, TrendingDown, Shield, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';

interface LendingPool {
  id: string;
  protocol: string;
  protocolIcon: string;
  token: string;
  tokenIcon: string;
  supplyApy: number;
  borrowApy: number;
  totalSupply: string;
  totalBorrow: string;
  utilization: number;
  collateralFactor: number;
  rewardsApy?: number;
}

const LENDING_POOLS: LendingPool[] = [
  {
    id: 'solend-sol',
    protocol: 'Solend',
    protocolIcon: '🟠',
    token: 'SOL',
    tokenIcon: '◎',
    supplyApy: 5.2,
    borrowApy: 7.8,
    totalSupply: '$420M',
    totalBorrow: '$180M',
    utilization: 43,
    collateralFactor: 75,
    rewardsApy: 1.2,
  },
  {
    id: 'solend-usdc',
    protocol: 'Solend',
    protocolIcon: '🟠',
    token: 'USDC',
    tokenIcon: '🔵',
    supplyApy: 8.4,
    borrowApy: 11.2,
    totalSupply: '$680M',
    totalBorrow: '$510M',
    utilization: 75,
    collateralFactor: 90,
    rewardsApy: 0.8,
  },
  {
    id: 'solend-usdt',
    protocol: 'Solend',
    protocolIcon: '🟠',
    token: 'USDT',
    tokenIcon: '🟢',
    supplyApy: 7.9,
    borrowApy: 10.8,
    totalSupply: '$290M',
    totalBorrow: '$195M',
    utilization: 67,
    collateralFactor: 90,
  },
  {
    id: 'marinade-msol',
    protocol: 'Marinade',
    protocolIcon: '🟣',
    token: 'mSOL',
    tokenIcon: '🟣',
    supplyApy: 3.1,
    borrowApy: 5.4,
    totalSupply: '$180M',
    totalBorrow: '$62M',
    utilization: 34,
    collateralFactor: 75,
  },
  {
    id: 'lido-stsol',
    protocol: 'Lido',
    protocolIcon: '🔵',
    token: 'stSOL',
    tokenIcon: '🔵',
    supplyApy: 2.8,
    borrowApy: 4.9,
    totalSupply: '$95M',
    totalBorrow: '$28M',
    utilization: 29,
    collateralFactor: 75,
  },
];

const MOCK_POSITIONS = [
  {
    protocol: 'Solend',
    type: 'Supply' as const,
    token: 'SOL',
    amount: 25.5,
    value: 3825,
    apy: 5.2,
  },
  {
    protocol: 'Solend',
    type: 'Borrow' as const,
    token: 'USDC',
    amount: 1200,
    value: 1200,
    apy: 11.2,
    healthFactor: 2.1,
  },
];

export function LendModule() {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'lend' | 'positions'>('lend');
  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'supply' | 'borrow'>('supply');
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    if (!connected || !selectedPool || !amount) return;
    setProcessing(true);
    setTimeout(() => setProcessing(false), 2000);
  };

  return (
    <Card
      title="Lend & Borrow"
      icon={<HandCoins size={18} />}
      description="Earn yield or borrow against collateral"
      badge={<span className="badge-amber">Solend</span>}
    >
      <div className="space-y-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
          {(['lend', 'positions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'lend' ? 'Markets' : 'My Positions'}
            </button>
          ))}
        </div>

        {activeTab === 'lend' ? (
          <>
            {/* Pool list */}
            <div className="space-y-1.5">
              {LENDING_POOLS.map((pool) => (
                <button
                  key={pool.id}
                  onClick={() => setSelectedPool(pool)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selectedPool?.id === pool.id
                      ? 'border-[var(--accent-purple)]/50 bg-[var(--accent-purple)]/5'
                      : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent-purple)]/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{pool.tokenIcon}</span>
                    <div>
                      <div className="text-sm font-semibold">{pool.token}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">{pool.protocol}</div>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="text-[var(--text-secondary)]">Supply</div>
                      <div className="font-semibold text-emerald-400">
                        {pool.supplyApy}%{pool.rewardsApy ? `+${pool.rewardsApy}%` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[var(--text-secondary)]">Borrow</div>
                      <div className="font-semibold text-amber-400">{pool.borrowApy}%</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[var(--text-secondary)]">Utilization</div>
                      <div className="font-medium">{pool.utilization}%</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected pool detail + action */}
            {selectedPool && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--text-secondary)]">Total Supply</span>
                      <div className="font-semibold mt-0.5">{selectedPool.totalSupply}</div>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Total Borrow</span>
                      <div className="font-semibold mt-0.5">{selectedPool.totalBorrow}</div>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Collateral Factor</span>
                      <div className="font-semibold mt-0.5">{selectedPool.collateralFactor}%</div>
                    </div>
                  </div>
                  {/* Utilization bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] mb-1">
                      <span>Utilization</span>
                      <span>{selectedPool.utilization}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-card)]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedPool.utilization > 80 ? 'bg-red-400' : selectedPool.utilization > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${selectedPool.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action toggle */}
                <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  {(['supply', 'borrow'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAction(a)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        action === a
                          ? a === 'supply'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {a === 'supply' ? 'Supply' : 'Borrow'}
                    </button>
                  ))}
                </div>

                {/* Amount input */}
                <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus-within:border-[var(--accent-purple)]/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {action === 'supply' ? 'Supply Amount' : 'Borrow Amount'}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">Balance: —</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <span className="font-semibold text-sm">{selectedPool.token}</span>
                    </div>
                  </div>
                  {amount && parseFloat(amount) > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
                      <span>Est. yearly {action === 'supply' ? 'earnings' : 'cost'}</span>
                      <span className={`font-semibold ${action === 'supply' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {action === 'supply'
                          ? `${(parseFloat(amount) * selectedPool.supplyApy / 100).toFixed(4)} ${selectedPool.token}`
                          : `${(parseFloat(amount) * selectedPool.borrowApy / 100).toFixed(4)} ${selectedPool.token}`}
                      </span>
                    </div>
                  )}
                </div>

                {action === 'borrow' && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-amber-400">
                      Borrowing requires collateral. Your position may be liquidated if health factor drops below 1.0.
                    </span>
                  </div>
                )}

                <button
                  onClick={handleAction}
                  disabled={!connected || !amount || processing}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    action === 'supply'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 disabled:opacity-40'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 disabled:opacity-40'
                  } disabled:cursor-not-allowed`}
                >
                  {!connected
                    ? 'Connect Wallet'
                    : processing
                      ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
                      : `${action === 'supply' ? 'Supply' : 'Borrow'} ${selectedPool.token}`}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Positions tab */
          <div className="space-y-3">
            {MOCK_POSITIONS.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
                No open positions. Start by supplying or borrowing from the Markets tab.
              </div>
            ) : (
              <>
                {MOCK_POSITIONS.map((pos, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${pos.type === 'Supply' ? 'badge-green' : 'badge-amber'}`}>
                            {pos.type === 'Supply' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {pos.type}
                          </span>
                          <span className="text-sm font-semibold">{pos.token}</span>
                          <span className="text-xs text-[var(--text-secondary)]">{pos.protocol}</span>
                        </div>
                        <div className="text-lg font-bold mt-1">
                          {pos.amount} <span className="text-sm text-[var(--text-secondary)]">(${pos.value.toLocaleString()})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[var(--text-secondary)]">APY</div>
                        <div className={`text-sm font-semibold ${pos.type === 'Supply' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {pos.apy}%
                        </div>
                        {pos.healthFactor && (
                          <div className="mt-1">
                            <span className={`badge ${pos.healthFactor > 1.5 ? 'badge-green' : pos.healthFactor > 1.1 ? 'badge-amber' : 'badge-red'}`}>
                              <Shield size={8} className="mr-0.5" />
                              HF: {pos.healthFactor.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Health summary */}
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Portfolio Health Factor</span>
                    <span className="text-sm font-bold text-emerald-400">2.1</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--bg-card)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" style={{ width: '70%' }} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[var(--text-secondary)]">
                    <span>Liquidation</span>
                    <span>Safe</span>
                  </div>
                </div>
              </>
            )}

            <a
              href="https://solend.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Manage on Solend <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
