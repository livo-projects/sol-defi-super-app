import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Landmark, TrendingUp, Shield, ExternalLink, Loader2, ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';

interface StakingOption {
  id: string;
  name: string;
  type: 'liquid' | 'native';
  apy: number;
  tvl: string;
  icon: string;
  description: string;
  minStake: number;
  protocol: string;
  risks: string[];
  features: string[];
}

const STAKING_OPTIONS: StakingOption[] = [
  {
    id: 'marinade',
    name: 'Marinade Finance',
    type: 'liquid',
    apy: 7.2,
    tvl: '$1.8B',
    icon: '🟣',
    description: 'Liquid staking — receive mSOL while earning rewards. Use mSOL across DeFi.',
    minStake: 0.01,
    protocol: 'Marinade',
    risks: ['Smart contract risk', 'mSOL depeg risk'],
    features: ['Liquid staking token (mSOL)', 'Instant unstake (small fee)', 'Use mSOL as collateral', 'Auto-compounding'],
  },
  {
    id: 'jito',
    name: 'Jito',
    type: 'liquid',
    apy: 7.8,
    tvl: '$2.1B',
    icon: '🟢',
    description: 'Liquid staking with MEV rewards — earn staking yield + MEV tips.',
    minStake: 0.01,
    protocol: 'Jito',
    risks: ['Smart contract risk', 'jitoSOL depeg risk'],
    features: ['MEV rewards included', 'Liquid staking token (jitoSOL)', 'Higher base yield', 'Auto-compounding'],
  },
  {
    id: 'lido',
    name: 'Lido (stSOL)',
    type: 'liquid',
    apy: 6.8,
    tvl: '$800M',
    icon: '🔵',
    description: 'Lido liquid staking — receive stSOL. Battle-tested protocol from Ethereum.',
    minStake: 0.01,
    protocol: 'Lido',
    risks: ['Smart contract risk', 'stSOL depeg risk'],
    features: ['Liquid staking token (stSOL)', 'Established protocol', 'DeFi composability', 'Auto-compounding'],
  },
  {
    id: 'native',
    name: 'Native Staking',
    type: 'native',
    apy: 6.5,
    tvl: '$40B+',
    icon: '🟠',
    description: 'Direct delegation to validators. Most secure, but tokens are locked during unstaking.',
    minStake: 0.01,
    protocol: 'Solana',
    risks: ['Unstake delay (2-3 days)', 'Validator risk'],
    features: ['No smart contract risk', 'Choose your validator', 'Support network decentralization', 'Direct on-chain'],
  },
];

const VALIDATORS = [
  { name: 'Marinade', commission: 0, apy: 7.2, score: 98, active: true },
  { name: 'Jito', commission: 0, apy: 7.8, score: 97, active: true },
  { name: 'Laine', commission: 5, apy: 6.9, score: 95, active: true },
  { name: 'Cogent Crypto', commission: 5, apy: 6.9, score: 94, active: true },
  { name: 'Solana Compass', commission: 7, apy: 6.7, score: 92, active: true },
];

export function StakeModule() {
  const { connected } = useWallet();
  const [selectedOption, setSelectedOption] = useState<StakingOption | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showValidators, setShowValidators] = useState(false);
  const [staking, setStaking] = useState(false);

  const handleStake = async () => {
    if (!connected || !selectedOption || !stakeAmount) return;
    setStaking(true);
    // In production: construct and send stake transaction
    setTimeout(() => setStaking(false), 2000);
  };

  return (
    <Card
      title="Stake SOL"
      icon={<Landmark size={18} />}
      description="Earn yield on your SOL"
      badge={<span className="badge-green">6.5–7.8% APY</span>}
    >
      <div className="space-y-4 pt-4">
        {/* Staking options grid */}
        <div className="grid grid-cols-2 gap-2">
          {STAKING_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedOption(opt)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedOption?.id === opt.id
                  ? 'border-[var(--accent-purple)]/50 bg-[var(--accent-purple)]/10'
                  : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent-purple)]/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{opt.icon}</span>
                <span className="text-sm font-semibold truncate">{opt.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold">{opt.apy}% APY</span>
                <span className={`badge ${opt.type === 'liquid' ? 'badge-blue' : 'badge-amber'}`}>
                  {opt.type}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected option details */}
        {selectedOption && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-secondary)] mb-2">{selectedOption.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--text-secondary)]">TVL</span>
                  <div className="font-semibold">{selectedOption.tvl}</div>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Min Stake</span>
                  <div className="font-semibold">{selectedOption.minStake} SOL</div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedOption.features.map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {f}
                  </span>
                ))}
              </div>

              {/* Risks */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedOption.risks.map((r) => (
                  <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ⚠ {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Stake amount */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus-within:border-[var(--accent-purple)]/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">Stake Amount</span>
                <span className="text-xs text-[var(--text-secondary)]">Balance: — SOL</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  min="0"
                  step="any"
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-lg">◎</span>
                  <span className="font-semibold text-sm">SOL</span>
                </div>
              </div>
              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Est. yearly rewards</span>
                  <span className="text-emerald-400 font-semibold">
                    +{(parseFloat(stakeAmount) * selectedOption.apy / 100).toFixed(4)} SOL
                    <span className="text-[var(--text-secondary)] ml-1">
                      (≈ ${(parseFloat(stakeAmount) * selectedOption.apy / 100 * 150).toFixed(2)})
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Native validator picker */}
            {selectedOption.type === 'native' && (
              <div>
                <button
                  onClick={() => setShowValidators(!showValidators)}
                  className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-full"
                >
                  <Shield size={14} />
                  <span>Select Validator ({VALIDATORS.length} recommended)</span>
                  <ChevronRight size={12} className={`ml-auto transition-transform ${showValidators ? 'rotate-90' : ''}`} />
                </button>
                {showValidators && (
                  <div className="mt-2 space-y-1">
                    {VALIDATORS.map((v) => (
                      <div
                        key={v.name}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--accent-purple)]/20 cursor-pointer transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{v.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            Commission: {v.commission}% · Score: {v.score}/100
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">{v.apy}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stake button */}
            <button
              onClick={handleStake}
              disabled={!connected || !stakeAmount || staking}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {!connected
                ? 'Connect Wallet to Stake'
                : staking
                  ? <><Loader2 size={18} className="animate-spin" /> Staking…</>
                  : `Stake with ${selectedOption.name}`}
            </button>
          </div>
        )}

        {/* Validator link */}
        <a
          href="https://stakewiz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Browse all validators on StakeWiz <ExternalLink size={10} />
        </a>
      </div>
    </Card>
  );
}
