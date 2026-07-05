import { PublicKey } from '@solana/web3.js';

// ─── Token Types ──────────────────────────────────────────────
export interface Token {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  tags?: string[];
  price?: number;
}

export interface TokenBalance {
  token: Token;
  amount: number;
  value: number; // USD value
  uiAmount: string;
}

// ─── Jupiter Types ────────────────────────────────────────────
export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  } | null;
  priceImpactPct: string;
  routePlan: RouteStep[];
  contextSlot: number;
  timeTaken: number;
}

export interface RouteStep {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface JupiterSwapResult {
  txid: string;
  inputTokenAmount: number;
  outputTokenAmount: number;
  inputToken: Token;
  outputToken: Token;
  fee: number;
}

// ─── Staking Types ────────────────────────────────────────────
export interface Validator {
  votePubkey: string;
  name: string;
  commission: number;
  apy: number;
  activeStake: number;
  totalStake: number;
  lastVote: number;
  score: number;
  delinquent: boolean;
}

export interface StakeAccount {
  pubkey: string;
  validator: string;
  validatorName: string;
  activeStake: number;
  activationEpoch: string;
  deactivationEpoch: string | null;
  status: 'active' | 'deactivating' | 'inactive' | 'activating';
  rewards: number;
  apy: number;
}

// ─── Lending Types ────────────────────────────────────────────
export interface LendingMarket {
  name: string;
  protocol: string;
  totalSupply: number;
  totalBorrow: number;
  supplyApy: number;
  borrowApy: number;
  collateralFactor: number;
  token: Token;
  utilization: number;
}

export interface BorrowPosition {
  market: LendingMarket;
  borrowed: number;
  collateral: number;
  collateralValue: number;
  borrowedValue: number;
  healthFactor: number;
  liquidationPrice: number;
}

// ─── Bridge Types ─────────────────────────────────────────────
export interface BridgeRoute {
  id: string;
  name: string;
  fromChain: string;
  toChain: string;
  fromToken: Token;
  toToken: Token;
  estimatedFee: number;
  estimatedTime: string;
  bridgeFee: number;
  gasFee: number;
  totalFee: number;
  slippage: number;
  icon: string;
}

// ─── Portfolio Types ──────────────────────────────────────────
export interface PortfolioPosition {
  type: 'swap' | 'stake' | 'lend' | 'borrow' | 'bridge';
  protocol: string;
  token: Token;
  amount: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  healthScore?: number;
  timestamp: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: PortfolioPosition[];
  swapVolume24h: number;
  stakedValue: number;
  lentValue: number;
  borrowedValue: number;
  netApy: number;
  healthScore: number;
}

// ─── Transaction Types ────────────────────────────────────────
export interface Transaction {
  signature: string;
  type: 'swap' | 'stake' | 'unstake' | 'lend' | 'borrow' | 'repay' | 'bridge' | 'transfer' | 'unknown';
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: number;
  amount: number;
  token: string;
  fee: number;
  from: string;
  to: string;
  description: string;
  explorerUrl: string;
}

// ─── UI Types ─────────────────────────────────────────────────
export type ModuleId = 'swap' | 'stake' | 'lend' | 'bridge' | 'portfolio' | 'history';

export interface ModuleConfig {
  id: ModuleId;
  title: string;
  icon: string;
  description: string;
  expanded: boolean;
  colSpan: 1 | 2 | 3;
}

// ─── API Response Types ───────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
