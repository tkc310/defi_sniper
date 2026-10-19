import {
  Contract,
  JsonRpcProvider,
  Wallet,
  WebSocketProvider,
  ZeroAddress,
  parseUnits,
  type ContractRunner,
  type Provider,
} from "ethers";
import { ERC20_ABI, FACTORY_ABI, PAIR_ABI, ROUTER_ABI } from "./abi.ts";
import { loadChainConfig, loadTradeConfig, type ChainConfig, type TradeConfig } from "./config.ts";

export type Explorer = {
  tx: (hash: string) => string;
  token: (address: string) => string;
  address: (address: string) => string;
};

export type ReadContext = {
  chain: ChainConfig;
  provider: Provider;
  factory: Contract;
  explorer: Explorer;
};

export type Side = "buy" | "sell";

export type TradeContext = ReadContext & {
  trade: TradeConfig;
  wallet: Wallet;
  router: Contract;
  /** 支払う側のトークン (buy: ADDRESS_FROM / sell: ADDRESS_TO) */
  tokenIn: string;
  /** 受け取る側のトークン (buy: ADDRESS_TO / sell: ADDRESS_FROM) */
  tokenOut: string;
  decimalsIn: number;
  /** AMOUNT (または MULTIPLE_AMOUNT) を tokenIn の decimals で変換した値 */
  amountIn: bigint;
};

export const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

export const erc20 = (address: string, runner: ContractRunner): Contract =>
  new Contract(address, ERC20_ABI, runner);

function createProvider(chain: ChainConfig): Provider {
  // WebSocket の方がイベント検知が速いので、設定されていれば優先する
  return chain.wsRpcUrl ? new WebSocketProvider(chain.wsRpcUrl) : new JsonRpcProvider(chain.rpcUrl);
}

function createExplorer(baseUrl: string): Explorer {
  return {
    tx: (hash) => `${baseUrl}/tx/${hash}`,
    token: (address) => `${baseUrl}/token/${address}`,
    address: (address) => `${baseUrl}/address/${address}`,
  };
}

/** 監視系コマンド用。秘密鍵を必要としない */
export function createReadContext(): ReadContext {
  const chain = loadChainConfig();
  const provider = createProvider(chain);
  return {
    chain,
    provider,
    factory: new Contract(chain.factory, FACTORY_ABI, provider),
    explorer: createExplorer(chain.explorerUrl),
  };
}

export async function createTradeContext(options: {
  side: Side;
  /** "multiple" のとき MULTIPLE_AMOUNT を使う */
  amount?: "single" | "multiple";
}): Promise<TradeContext> {
  const read = createReadContext();
  const trade = loadTradeConfig();
  const wallet = new Wallet(trade.privateKey, read.provider);

  const [tokenIn, tokenOut] =
    options.side === "buy" ? [trade.addressFrom, trade.addressTo] : [trade.addressTo, trade.addressFrom];

  const decimalsIn = Number(await erc20(tokenIn, read.provider).getFunction("decimals")());
  const amountText = options.amount === "multiple" ? trade.multipleAmount : trade.amount;

  return {
    ...read,
    factory: read.factory.connect(wallet) as Contract,
    trade,
    wallet,
    router: new Contract(read.chain.router, ROUTER_ABI, wallet),
    tokenIn,
    tokenOut,
    decimalsIn,
    amountIn: parseUnits(amountText, decimalsIn),
  };
}

/** 基軸トークンと対象トークンのペアコントラクトを取得する。ペア未作成ならエラー */
export async function getPairContract(ctx: ReadContext, token: string): Promise<Contract> {
  const pairAddress: string = await ctx.factory.getFunction("getPair")(ctx.chain.base, token);
  if (sameAddress(pairAddress, ZeroAddress)) {
    throw new Error(
      `ペアがまだ存在しません (${ctx.chain.base} / ${token})。PairCreated を待つ場合は snipe:pair-created を使ってください`,
    );
  }
  return new Contract(pairAddress, PAIR_ABI, ctx.provider);
}
