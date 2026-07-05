import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import type { Token, TokenBalance } from '../types';
import { POPULAR_TOKENS, usePriceFeed } from './useJupiter';

interface ParsedTokenAccount {
  pubkey: string;
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: string;
}

export function useTokenBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { getPrices } = usePriceFeed();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [solBalance, setSolBalance] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances([]);
      setSolBalance(0);
      setTotalValue(0);
      return;
    }

    setLoading(true);
    try {
      // Get SOL balance
      const lamports = await connection.getBalance(publicKey);
      const solAmount = lamports / LAMPORTS_PER_SOL;
      setSolBalance(solAmount);

      // Get SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      const parsed: ParsedTokenAccount[] = tokenAccounts.value.map((ta) => ({
        pubkey: ta.pubkey.toBase58(),
        mint: ta.account.data.parsed.info.mint,
        amount: ta.account.data.parsed.info.tokenAmount.uiAmount || 0,
        decimals: ta.account.data.parsed.info.tokenAmount.decimals,
        uiAmount: ta.account.data.parsed.info.tokenAmount.uiAmountString || '0',
      })).filter((t) => t.amount > 0);

      // Fetch prices for all tokens
      const mints = ['So11111111111111111111111111111111111111112', ...parsed.map((t) => t.mint)];
      const prices = await getPrices(mints);

      // Build SOL balance entry
      const solPrice = prices.get('So11111111111111111111111111111111111111112') || 0;
      const solEntry: TokenBalance = {
        token: POPULAR_TOKENS.find((t) => t.symbol === 'SOL') || POPULAR_TOKENS[0],
        amount: solAmount,
        value: solAmount * solPrice,
        uiAmount: solAmount.toFixed(4),
      };

      // Build SPL token entries
      const splEntries: TokenBalance[] = parsed.map((t) => {
        const known = POPULAR_TOKENS.find((p) => p.address === t.mint);
        const price = prices.get(t.mint) || 0;
        return {
          token: known || {
            chainId: 101,
            address: t.mint,
            symbol: t.mint.slice(0, 6),
            name: 'Unknown Token',
            decimals: t.decimals,
            logoURI: '',
            price,
          },
          amount: t.amount,
          value: t.amount * price,
          uiAmount: t.uiAmount,
        };
      }).sort((a, b) => b.value - a.value);

      const allBalances = [solEntry, ...splEntries];
      setBalances(allBalances);
      setTotalValue(allBalances.reduce((s, b) => s + b.value, 0));
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, getPrices]);

  useEffect(() => {
    fetchBalances();
    if (!publicKey) return;
    const id = setInterval(fetchBalances, 20000);
    return () => clearInterval(id);
  }, [fetchBalances, publicKey]);

  return { balances, solBalance, totalValue, loading, refetch: fetchBalances };
}
