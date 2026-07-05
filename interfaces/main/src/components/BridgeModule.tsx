import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bridge, ArrowRight, Clock, DollarSign, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';

interface BridgeRoute {
  id: string;
  name: string;
  icon: string;
  fromChain: string;
  toChain: string;
  estimatedFee: string;
  estimatedTime: string;
  bridgeFee: number;
  gasFee: number;
  reliability: number;
  supported: boolean;
}

const BRIDGE_ROUTES: BridgeRoute[] = [
  {
    id: 'wormhole-eth',
    name: 'Wormhole',
    icon: '🌀',
    fromChain: 'Solana',
    toChain: 'Ethereum',
    estimatedFee: '$4.20',
    estimatedTime: '~15 min',
    bridgeFee: 0.1,
    gasFee: 4.1,
    reliability: 98,
    supported: true,
  },
  {
    id: 'wormhole-bsc',
    name: 'Wormhole',
    icon: '🌀',
    fromChain: 'Solana',
    toChain: 'BNB Chain',
    estimatedFee: '$1.80',
    estimatedTime: '~12 min',
    bridgeFee: 0.05,
    gasFee: 1.75,
    reliability: 97,
    supported: true,
  },
  {
    id: 'allbridge-eth',
    name: 'Allbridge',
    icon: '🌉',
    fromChain: 'Solana',
    toChain: 'Ethereum',
    estimatedFee: '$5.10',
    estimatedTime: '~20 min',
    bridgeFee: 0.15,
    gasFee: 4.95,
    reliability: 96,
    supported: true,
  },
  {
    id: 'allbridge-avax',
    name: 'Allbridge',
    icon: '🌉',
    fromChain: 'Solana',
    toChain: 'Avalanche',
    estimatedFee: '$2.30',
    estimatedTime: '~10 min',
    bridgeFee: 0.08,
    gasFee: 2.22,
    reliability: 95,
    supported: true,
  },
  {
    id: 'wormhole-polygon',
    name: 'Wormhole',
    icon: '🌀',
    fromChain: 'Solana',
    toChain: 'Polygon',
    estimatedFee: '$0.90',
    estimatedTime: '~15 min',
    bridgeFee: 0.05,
    gasFee: 0.85,
    reliability: 97,
    supported: true,
  },
  {
    id: 'allbridge-arbitrum',
    name: 'Allbridge',
    icon: '🌉',
    fromChain: 'Solana',
    toChain: 'Arbitrum',
    estimatedFee: '$3.50',
    estimatedTime: '~18 min',
    bridgeFee: 0.12,
    gasFee: 3.38,
    reliability: 94,
    supported: true,
  },
];

const CHAINS = ['All', 'Ethereum', 'BNB Chain', 'Polygon', 'Avalanche', 'Arbitrum'];

export function BridgeModule() {
  const { connected } = useWallet();
  const [filterChain, setFilterChain] = useState('All');
  const [selectedRoute, setSelectedRoute] = useState<BridgeRoute | null>(null);
  const [amount, setAmount] = useState('');
  const [bridging, setBridging] = useState(false);

  const filtered = filterChain === 'All'
    ? BRIDGE_ROUTES
    : BRIDGE_ROUTES.filter((r) => r.toChain === filterChain);

  const handleBridge = async () => {
    if (!connected || !selectedRoute || !amount) return;
    setBridging(true);
    setTimeout(() => setBridging(false), 2000);
  };

  return (
    <Card
      title="Bridge"
      icon={<Bridge size={18} />}
      description="Cross-chain transfers from Solana"
      badge={<span className="badge-blue">Wormhole · Allbridge</span>}
    >
      <div className="space-y-4 pt-4">
        {/* Chain filter */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {CHAINS.map((chain) => (
            <button
              key={chain}
              onClick={() => { setFilterChain(chain); setSelectedRoute(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filterChain === chain
                  ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        {/* Route list */}
        <div className="space-y-1.5">
          {filtered.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                selectedRoute?.id === route.id
                  ? 'border-[var(--accent-purple)]/50 bg-[var(--accent-purple)]/5'
                  : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent-purple)]/20'
              }`}
            >
              <span className="text-xl">{route.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{route.name}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">via</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <span>{route.fromChain}</span>
                  <ArrowRight size={10} />
                  <span>{route.toChain}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{route.estimatedFee}</div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <Clock size={10} />
                  {route.estimatedTime}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected route detail */}
        {selectedRoute && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[var(--text-secondary)]">Bridge Fee</span>
                  <div className="font-semibold mt-0.5">${selectedRoute.bridgeFee.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Gas Fee</span>
                  <div className="font-semibold mt-0.5">${selectedRoute.gasFee.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Est. Time</span>
                  <div className="font-semibold mt-0.5">{selectedRoute.estimatedTime}</div>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Reliability</span>
                  <div className="font-semibold mt-0.5 text-emerald-400">{selectedRoute.reliability}%</div>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus-within:border-[var(--accent-purple)]/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">Amount to Bridge</span>
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
                  <span className="font-semibold text-sm">SOL</span>
                </div>
              </div>
              {amount && parseFloat(amount) > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
                  <span>You will receive (est.)</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    ≈ {(parseFloat(amount) - selectedRoute.bridgeFee / 150).toFixed(6)} SOL
                  </span>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-amber-400">
                Bridge times vary by network congestion. Funds will arrive on {selectedRoute.toChain} after confirmation.
              </span>
            </div>

            <button
              onClick={handleBridge}
              disabled={!connected || !amount || bridging}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {!connected
                ? 'Connect Wallet to Bridge'
                : bridging
                  ? <><Loader2 size={18} className="animate-spin" /> Bridging…</>
                  : `Bridge via ${selectedRoute.name}`}
            </button>
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-4">
          <a href="https://wormhole.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Wormhole <ExternalLink size={10} />
          </a>
          <a href="https://allbridge.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Allbridge <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </Card>
  );
}
