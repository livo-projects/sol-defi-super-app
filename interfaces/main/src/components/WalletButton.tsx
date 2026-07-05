import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function WalletButton() {
  const { connection } = useConnection();
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    let mounted = true;
    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (mounted) setBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (mounted) setBalance(null);
      }
    };
    fetchBalance();
    const id = setInterval(fetchBalance, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, [publicKey, connection]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shortAddr = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  const copyAddr = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (connecting) {
    return (
      <button className="btn-secondary flex items-center gap-2 opacity-70 cursor-wait">
        <div className="w-4 h-4 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" />
        Connecting…
      </button>
    );
  }

  if (!connected || !publicKey) {
    return (
      <button onClick={() => setVisible(true)} className="btn-primary flex items-center gap-2">
        <Wallet size={18} />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn-secondary flex items-center gap-3 pr-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-sm">{shortAddr}</span>
        </div>
        {balance !== null && (
          <span className="text-sm text-[var(--text-secondary)] border-l border-[var(--border-color)] pl-3">
            {balance.toFixed(4)} SOL
          </span>
        )}
        <ChevronDown size={14} className={`text-[var(--text-secondary)] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-72 glass-card p-2 z-50 shadow-xl shadow-black/30">
          {/* Balance display */}
          <div className="px-3 py-3 border-b border-[var(--border-color)] mb-2">
            <div className="text-xs text-[var(--text-secondary)] mb-1">Balance</div>
            <div className="text-xl font-bold">
              {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading…'}
            </div>
            {balance !== null && (
              <div className="text-sm text-[var(--text-secondary)]">
                ≈ ${(balance * 150).toFixed(2)} USD
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={copyAddr}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-sm"
          >
            <Copy size={16} className="text-[var(--text-secondary)]" />
            <span>{copied ? 'Copied!' : 'Copy Address'}</span>
          </button>
          <a
            href={`https://solscan.io/account/${publicKey.toBase58()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-sm"
            onClick={() => setShowDropdown(false)}
          >
            <ExternalLink size={16} className="text-[var(--text-secondary)]" />
            <span>View on Solscan</span>
          </a>
          <button
            onClick={() => { disconnect(); setShowDropdown(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-sm text-red-400"
          >
            <LogOut size={16} />
            <span>Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}
