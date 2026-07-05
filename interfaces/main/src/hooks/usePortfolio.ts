import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import type { Transaction } from '../types';

const EXPLORER_TX = 'https://solscan.io/tx/';

export function useTransactionHistory() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!publicKey) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    try {
      const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 20 });

      const txs: Transaction[] = sigs.map((sig) => {
        const ts = sig.blockTime ? sig.blockTime * 1000 : Date.now();
        const err = sig.err !== null;

        // Infer type from memo / description patterns
        let type: Transaction['type'] = 'unknown';
        const memo = sig.memo || '';
        if (memo.toLowerCase().includes('swap')) type = 'swap';
        else if (memo.toLowerCase().includes('stake')) type = 'stake';
        else if (memo.toLowerCase().includes('bridge')) type = 'bridge';

        return {
          signature: sig.signature,
          type,
          status: err ? 'failed' : 'confirmed',
          timestamp: ts,
          amount: 0,
          token: 'SOL',
          fee: 0.000005,
          from: publicKey.toBase58(),
          to: '',
          description: memo || `Transaction ${sig.signature.slice(0, 8)}…`,
          explorerUrl: `${EXPLORER_TX}${sig.signature}`,
        };
      });

      setTransactions(txs);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { transactions, loading, refetch: fetchHistory };
}

// Mock portfolio data for demo (would be backed by on-chain position tracking)
export function usePortfolioData() {
  const [portfolio] = useState({
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    swapVolume24h: 0,
    stakedValue: 0,
    lentValue: 0,
    borrowedValue: 0,
    netApy: 0,
    healthScore: 100,
    positions: [] as any[],
  });

  return portfolio;
}
