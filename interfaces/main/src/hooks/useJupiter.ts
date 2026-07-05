import { useState, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import type { JupiterQuote, Token, RouteStep } from '../types';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

// Popular Solana tokens for default display
export const POPULAR_TOKENS: Token[] = [
  { chainId: 101, address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', decimals: 9, logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', price: 0 },
  { chainId: 101, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png', price: 1 },
  { chainId: 101, address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether USD', decimals: 6, logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png', price: 1 },
  { chainId: 101, address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', name: 'Marinade staked SOL', decimals: 9, logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png', price: 0 },
  { chainId: 101, address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'jitoSOL', name: 'Jito Staked SOL', decimals: 9, logoURI: 'https://storage.googleapis.com/token-metadata/JitoSOL-256.png', price: 0 },
  { chainId: 101, address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', symbol: 'stSOL', name: 'Lido Staked SOL', decimals: 9, logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj/logo.png', price: 0 },
  { chainId: 101, address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5, logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wKwfRcGm7c', price: 0 },
  { chainId: 101, address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat', decimals: 6, logoURI: 'https://bafkreibk3covnwch7l3tk6fkzrj4sllrsfdxh57kpc5wqv7o5n345cdvbu.ipfs.nftstorage.link', price: 0 },
];

export function useJupiter() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const fetchQuote = useCallback(
    async (inputMint: string, outputMint: string, amount: number, slippageBps = 50) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      if (!inputMint || !outputMint || amount <= 0) {
        setQuote(null);
        setRouteSteps([]);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          inputMint,
          outputMint,
          amount: Math.floor(amount).toString(),
          slippageBps: slippageBps.toString(),
          onlyDirectRoutes: 'false',
          asLegacyTransaction: 'false',
        });

        const res = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`, {
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `Quote failed: ${res.status}`);
        }

        const data: JupiterQuote = await res.json();
        setQuote(data);
        setRouteSteps(data.routePlan || []);
        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') return null;
        setError(err.message || 'Failed to fetch quote');
        setQuote(null);
        setRouteSteps([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const executeSwap = useCallback(async () => {
    if (!quote || !publicKey || !signTransaction) {
      throw new Error('Missing quote or wallet');
    }

    setLoading(true);
    setError(null);

    try {
      const swapRes = await fetch(`${JUPITER_QUOTE_API}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!swapRes.ok) {
        const body = await swapRes.text();
        throw new Error(body || `Swap failed: ${swapRes.status}`);
      }

      const { swapTransaction } = await swapRes.json();

      const txBuf = Buffer.from(swapTransaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBuf);
      const signed = await signTransaction(tx);

      const rawTx = signed.serialize();
      const txid = await connection.sendRawTransaction(rawTx, {
        skipPreflight: true,
        maxRetries: 3,
      });

      const latest = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction(
        { signature: txid, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        'confirmed',
      );

      return txid;
    } catch (err: any) {
      setError(err.message || 'Swap failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quote, publicKey, signTransaction, connection]);

  return {
    quote,
    routeSteps,
    loading,
    error,
    fetchQuote,
    executeSwap,
    clearQuote: () => { setQuote(null); setRouteSteps([]); setError(null); },
  };
}

export function useTokenList() {
  const [tokens, setTokens] = useState<Token[]>(POPULAR_TOKENS);
  const [loaded, setLoaded] = useState(false);

  const loadTokens = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch('https://token.jup.ag/strict');
      if (res.ok) {
        const data: Token[] = await res.json();
        const map = new Map<string, Token>();
        for (const t of POPULAR_TOKENS) map.set(t.address, t);
        for (const t of data) {
          if (!map.has(t.address)) map.set(t.address, t);
        }
        setTokens(Array.from(map.values()));
        setLoaded(true);
      }
    } catch {
      // Keep popular tokens as fallback
    }
  }, [loaded]);

  return { tokens, loadTokens, loaded };
}

export function usePriceFeed() {
  const cache = useRef<Map<string, { price: number; ts: number }>>(new Map());

  const getPrice = useCallback(async (mint: string): Promise<number | null> => {
    const cached = cache.current.get(mint);
    if (cached && Date.now() - cached.ts < 30000) return cached.price;

    try {
      const res = await fetch(`${JUPITER_PRICE_API}?ids=${mint}`);
      if (!res.ok) return null;
      const data = await res.json();
      const price = data.data?.[mint]?.price;
      if (price != null) {
        cache.current.set(mint, { price: Number(price), ts: Date.now() });
        return Number(price);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const getPrices = useCallback(async (mints: string[]): Promise<Map<string, number>> => {
    const prices = new Map<string, number>();
    try {
      const res = await fetch(`${JUPITER_PRICE_API}?ids=${mints.join(',')}`);
      if (!res.ok) return prices;
      const data = await res.json();
      for (const mint of mints) {
        const price = data.data?.[mint]?.price;
        if (price != null) {
          prices.set(mint, Number(price));
          cache.current.set(mint, { price: Number(price), ts: Date.now() });
        }
      }
    } catch { /* ignore */ }
    return prices;
  }, []);

  return { getPrice, getPrices };
}
