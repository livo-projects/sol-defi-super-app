import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowDownUp, Settings, Route, AlertTriangle, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { Card } from './ui/Card';
import { TokenSelect } from './ui/TokenSelect';
import { useJupiter, useTokenList, usePriceFeed, POPULAR_TOKENS } from '../hooks/useJupiter';
import type { Token, RouteStep } from '../types';

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1, 2];

export function SwapModule() {
  const { connected } = useWallet();
  const { tokens, loadTokens } = useTokenList();
  const { quote, routeSteps, loading, error, fetchQuote, executeSwap, clearQuote } = useJupiter();
  const { getPrice } = usePriceFeed();

  const [inputToken, setInputToken] = useState<Token>(POPULAR_TOKENS[0]); // SOL
  const [outputToken, setOutputToken] = useState<Token>(POPULAR_TOKENS[1]); // USDC
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [inputPrice, setInputPrice] = useState<number>(0);
  const [outputPrice, setOutputPrice] = useState<number>(0);

  // Load full token list on mount
  useEffect(() => { loadTokens(); }, [loadTokens]);

  // Fetch prices for selected tokens
  useEffect(() => {
    const run = async () => {
      const [ip, op] = await Promise.all([getPrice(inputToken.address), getPrice(outputToken.address)]);
      setInputPrice(ip || 0);
      setOutputPrice(op || 0);
    };
    run();
  }, [inputToken, outputToken, getPrice]);

  // Auto-fetch quote when inputs change
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      clearQuote();
      return;
    }
    const rawAmount = parseFloat(inputAmount) * 10 ** inputToken.decimals;
    const timer = setTimeout(() => {
      fetchQuote(inputToken.address, outputToken.address, rawAmount, Math.round(slippage * 100));
    }, 400);
    return () => clearTimeout(timer);
  }, [inputToken, outputToken, inputAmount, slippage, fetchQuote, clearQuote]);

  const outputAmount = quote
    ? (parseInt(quote.outAmount) / 10 ** outputToken.decimals).toFixed(6)
    : '';

  const priceImpact = quote ? parseFloat(quote.priceImpactPct) : 0;
  const priceImpactWarning = priceImpact > 1;
  const priceImpactSevere = priceImpact > 5;

  const inputUsd = inputAmount && inputPrice ? (parseFloat(inputAmount) * inputPrice).toFixed(2) : '';
  const outputUsd = outputAmount && outputPrice ? (parseFloat(outputAmount) * outputPrice).toFixed(2) : '';

  const handleSwap = async () => {
    if (!connected || !quote) return;
    setSwapping(true);
    setTxSignature(null);
    try {
      const sig = await executeSwap();
      setTxSignature(sig);
      setInputAmount('');
    } catch {
      // Error is handled in hook
    } finally {
      setSwapping(false);
    }
  };

  const flipTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(outputAmount || '');
    clearQuote();
    setTxSignature(null);
  };

  const handleInputTokenChange = (token: Token) => {
    if (token.address === outputToken.address) {
      setOutputToken(inputToken);
    }
    setInputToken(token);
    clearQuote();
    setTxSignature(null);
  };

  const handleOutputTokenChange = (token: Token) => {
    if (token.address === inputToken.address) {
      setInputToken(outputToken);
    }
    setOutputToken(token);
    clearQuote();
    setTxSignature(null);
  };

  const minReceived = quote
    ? (parseInt(quote.otherAmountThreshold) / 10 ** outputToken.decimals).toFixed(6)
    : '';

  return (
    <Card
      title="Swap"
      icon={<ArrowDownUp size={18} />}
      description="Best-rate swaps via Jupiter aggregator"
      badge={<span className="badge-blue">Jupiter V6</span>}
      headerRight={
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <Settings size={16} className="text-[var(--text-secondary)]" />
        </button>
      }
    >
      <div className="space-y-3 pt-4">
        {/* Slippage settings */}
        {showSettings && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] mb-2">
            <span className="text-xs text-[var(--text-secondary)] mr-2">Slippage:</span>
            {SLIPPAGE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  slippage === s
                    ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30'
                    : 'text-[var(--text-secondary)] hover:bg-white/[0.04]'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus-within:border-[var(--accent-purple)]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-secondary)]">You pay</span>
            {inputUsd && <span className="text-xs text-[var(--text-secondary)]">≈ ${inputUsd}</span>}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => { setInputAmount(e.target.value); setTxSignature(null); }}
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              min="0"
              step="any"
            />
            <TokenSelect
              tokens={tokens}
              selected={inputToken}
              onSelect={handleInputTokenChange}
            />
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button
            onClick={flipTokens}
            className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-purple)]/30 transition-all active:scale-90"
          >
            <ArrowDownUp size={16} className="text-[var(--accent-purple)]" />
          </button>
        </div>

        {/* Output */}
        <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-secondary)]">You receive</span>
            {outputUsd && <span className="text-xs text-[var(--text-secondary)]">≈ ${outputUsd}</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-bold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-[var(--accent-purple)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Fetching…</span>
                </div>
              ) : (
                outputAmount || <span className="text-[var(--text-secondary)]/30">0.00</span>
              )}
            </div>
            <TokenSelect
              tokens={tokens}
              selected={outputToken}
              onSelect={handleOutputTokenChange}
            />
          </div>
        </div>

        {/* Price Impact Warning */}
        {quote && priceImpactWarning && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border ${
              priceImpactSevere
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            <AlertTriangle size={16} />
            <span className="text-xs font-medium">
              Price impact: {priceImpact.toFixed(2)}% — {priceImpactSevere ? 'High slippage, swap at your own risk' : 'Consider smaller amount'}
            </span>
          </div>
        )}

        {/* Route Details */}
        {quote && routeSteps.length > 0 && (
          <div>
            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-full"
            >
              <Route size={14} />
              <span>Route ({routeSteps.length} hop{routeSteps.length > 1 ? 's' : ''})</span>
              <span className="ml-auto text-[var(--accent-purple)]">
                Impact: {priceImpact.toFixed(2)}%
              </span>
            </button>

            {showRoutes && (
              <div className="mt-2 space-y-1.5">
                {routeSteps.map((step, i) => (
                  <RouteStepRow key={i} step={step} index={i} />
                ))}
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)] mt-2">
                  <span>Minimum received: {minReceived} {outputToken.symbol}</span>
                  <span>Slippage: {slippage}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle size={16} />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {/* Success */}
        {txSignature && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={16} />
            <span className="text-xs flex-1">Swap successful!</span>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:underline"
            >
              View <ExternalLink size={10} />
            </a>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!connected || !quote || loading || swapping || !inputAmount}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {!connected ? (
            'Connect Wallet to Swap'
          ) : swapping ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Swapping…
            </>
          ) : loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Loading Quote…
            </>
          ) : !inputAmount ? (
            'Enter an Amount'
          ) : !quote ? (
            'No Route Found'
          ) : (
            'Swap'
          )}
        </button>
      </div>
    </Card>
  );
}

function RouteStepRow({ step, index }: { step: RouteStep; index: number }) {
  const { swapInfo } = step;
  const inputSymbol = POPULAR_TOKENS.find((t) => t.address === swapInfo.inputMint)?.symbol || swapInfo.inputMint.slice(0, 4);
  const outputSymbol = POPULAR_TOKENS.find((t) => t.address === swapInfo.outputMint)?.symbol || swapInfo.outputMint.slice(0, 4);

  return (
    <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[var(--bg-primary)]">
      <div className="w-5 h-5 rounded-full bg-[var(--accent-purple)]/10 flex items-center justify-center text-[8px] font-bold text-[var(--accent-purple)]">
        {index + 1}
      </div>
      <span className="text-[var(--text-secondary)]">{inputSymbol} → {outputSymbol}</span>
      <span className="text-[var(--text-secondary)] opacity-50">via</span>
      <span className="font-medium">{swapInfo.label}</span>
      <span className="ml-auto text-[var(--text-secondary)]">{step.percent}%</span>
    </div>
  );
}
