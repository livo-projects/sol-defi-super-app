import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { Token } from '../../types';

interface TokenSelectProps {
  tokens: Token[];
  selected: Token | null;
  onSelect: (token: Token) => void;
  label?: string;
  disabled?: boolean;
}

export function TokenSelect({ tokens, selected, onSelect, label, disabled }: TokenSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative" ref={ref}>
      {label && <label className="text-xs text-[var(--text-secondary)] mb-1 block">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen(!open); setSearch(''); } }}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--accent-purple)]/30 transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selected ? (
          <>
            <img
              src={selected.logoURI}
              alt={selected.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-semibold text-sm">{selected.symbol}</span>
            <span className="text-xs text-[var(--text-secondary)] ml-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-sm text-[var(--text-secondary)]">Select token</span>
        )}
        <ChevronDown size={14} className="ml-auto text-[var(--text-secondary)]" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-50 max-h-72 flex flex-col shadow-xl shadow-black/40">
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] mb-2">
            <Search size={14} className="text-[var(--text-secondary)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tokens…"
              className="bg-transparent text-sm flex-1 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={12} className="text-[var(--text-secondary)]" />
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="text-center text-sm text-[var(--text-secondary)] py-4">No tokens found</div>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.address}
                  onClick={() => { onSelect(token); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors ${
                    selected?.address === token.address ? 'bg-[var(--accent-purple)]/10' : ''
                  }`}
                >
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-7 h-7 rounded-full"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-semibold">{token.symbol}</div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">{token.name}</div>
                  </div>
                  {token.price && (
                    <div className="text-xs text-[var(--text-secondary)]">${token.price.toFixed(2)}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
