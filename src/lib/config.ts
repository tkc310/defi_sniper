import { getAddress } from "ethers";
import { flag, int, loadPreset, optional, required } from "./env.ts";

export const DEX_PRESETS = ["pancake", "bakery", "pangolin"] as const;
export type DexPreset = (typeof DEX_PRESETS)[number];

export type ChainConfig = {
  dex: DexPreset;
  rpcUrl: string;
  wsRpcUrl?: string;
  explorerUrl: string;
  router: string;
  factory: string;
  base: string;
};

export type TradeConfig = {
  addressFrom: string;
  addressTo: string;
  amount: string;
  multipleAmount: string;
  deadlineMin: number;
  tradeGasLimit: bigint;
  tradeGasPriceGwei: string;
  approveGasLimit: bigint;
  approveGasPriceGwei: string;
  privateKey: string;
  webhookUrl?: string;
  /** true のときトランザクションを送信しない (旧 DEBUG=1 も互換で受け付ける) */
  dryRun: boolean;
};

function resolveDex(): DexPreset {
  const dex = (optional("DEX") ?? "pancake") as DexPreset;
  if (!DEX_PRESETS.includes(dex)) {
    throw new Error(`DEX は ${DEX_PRESETS.join(" | ")} のいずれかを指定してください: ${dex}`);
  }
  return dex;
}

export function loadChainConfig(): ChainConfig {
  const dex = resolveDex();
  loadPreset(dex);
  return {
    dex,
    rpcUrl: required("RPC_URL"),
    wsRpcUrl: optional("WS_RPC_URL"),
    explorerUrl: (optional("EXPLORER_URL") ?? "https://bscscan.com").replace(/\/$/, ""),
    router: getAddress(required("ADDRESS_ROUTER")),
    factory: getAddress(required("ADDRESS_FACTORY")),
    base: getAddress(required("ADDRESS_BASE")),
  };
}

export function loadTradeConfig(): TradeConfig {
  return {
    addressFrom: getAddress(required("ADDRESS_FROM")),
    addressTo: getAddress(required("ADDRESS_TO")),
    amount: required("AMOUNT"),
    multipleAmount: optional("MULTIPLE_AMOUNT") ?? "1",
    deadlineMin: int("DEADLINE_MIN", 5),
    tradeGasLimit: BigInt(int("TRADE_GAS_LIMIT", 500_000)),
    tradeGasPriceGwei: optional("TRADE_GAS_PRICE") ?? "5",
    approveGasLimit: BigInt(int("APPROVE_GAS_LIMIT", 300_000)),
    approveGasPriceGwei: optional("APPROVE_GAS_PRICE") ?? "5",
    privateKey: required("PRIVATE_KEY"),
    webhookUrl: optional("WEBHOOK_URL"),
    dryRun: flag("DRY_RUN") || flag("DEBUG"),
  };
}
