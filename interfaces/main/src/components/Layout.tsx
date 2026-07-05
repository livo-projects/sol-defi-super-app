import { type ReactNode } from 'react';
import { WalletButton } from './WalletButton';
import { Activity, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center glow-purple">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">SolDeFi</h1>
              <p className="text-[10px] text-[var(--text-secondary)] -mt-0.5 hidden sm:block">
                Super App Dashboard
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {['Dashboard', 'Swap', 'Stake', 'Lend', 'Bridge'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Activity size={12} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Mainnet</span>
            </div>
            <WalletButton />
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-white/[0.04]"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenu && (
          <nav className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3">
            {['Dashboard', 'Swap', 'Stake', 'Lend', 'Bridge'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenu(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]"
              >
                {item}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>SolDeFi Super App — Powered by Jupiter, Marinade & Solana</span>
          <a
            href="https://solscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            Explorer ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
