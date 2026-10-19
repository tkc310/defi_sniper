import { formatUnits, parseUnits, type ContractTransactionResponse } from "ethers";
import { sameAddress, type TradeContext } from "./context.ts";
import { notify } from "./notify.ts";

/**
 * - exactIn: 支払う数量を指定 (swapExactTokensForTokens)
 * - exactOut: 受け取る数量を指定 (swapTokensForExactTokens) — 購入上限があるトークン向け
 * - exactInFeeOnTransfer: 送金手数料付き (デフレ) トークン向け。トークンによっては使えないので注意
 */
export type SwapOrder =
  | { mode: "exactIn"; amountIn: bigint; amountOutMin?: bigint }
  | { mode: "exactOut"; amountOut: bigint; amountInMax: bigint }
  | { mode: "exactInFeeOnTransfer"; amountIn: bigint; amountOutMin?: bigint };

/** tokenIn / tokenOut のどちらも基軸トークンでなければ基軸トークンを経由する */
export function buildPath(tokenIn: string, tokenOut: string, base: string): string[] {
  const touchesBase = [tokenIn, tokenOut].some((t) => sameAddress(t, base));
  return touchesBase ? [tokenIn, tokenOut] : [tokenIn, base, tokenOut];
}

export async function swap(ctx: TradeContext, order: SwapOrder): Promise<void> {
  const { trade, router, wallet, explorer } = ctx;
  const path = buildPath(ctx.tokenIn, ctx.tokenOut, ctx.chain.base);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * trade.deadlineMin);
  const overrides = {
    gasLimit: trade.tradeGasLimit,
    gasPrice: parseUnits(trade.tradeGasPriceGwei, "gwei"),
  };

  if (trade.dryRun) {
    console.log("--- DRY_RUN: swap は送信しません ---");
    console.log({ ...order, path, deadline, overrides });
    return;
  }

  console.log(`Sending ${order.mode} swap...`);
  // スナイプ用途なのでスリッページ保護はデフォルトで無効 (amountOutMin = 0)
  let tx: ContractTransactionResponse;
  switch (order.mode) {
    case "exactIn":
      tx = await router.getFunction("swapExactTokensForTokens")(
        order.amountIn,
        order.amountOutMin ?? 0n,
        path,
        wallet.address,
        deadline,
        overrides,
      );
      break;
    case "exactOut":
      tx = await router.getFunction("swapTokensForExactTokens")(
        order.amountOut,
        order.amountInMax,
        path,
        wallet.address,
        deadline,
        overrides,
      );
      break;
    case "exactInFeeOnTransfer":
      tx = await router.getFunction("swapExactTokensForTokensSupportingFeeOnTransferTokens")(
        order.amountIn,
        order.amountOutMin ?? 0n,
        path,
        wallet.address,
        deadline,
        overrides,
      );
      break;
  }

  console.log(`Tx: ${explorer.tx(tx.hash)}`);
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`swap が失敗しました: ${explorer.tx(tx.hash)}`);
  }
  console.log("Order Success 🎉🎉🎉");
  console.log(`Mined in block: ${receipt.blockNumber}`);

  const amountLabel =
    order.mode === "exactOut"
      ? `out=${order.amountOut} (max in ${formatUnits(order.amountInMax, ctx.decimalsIn)})`
      : `in=${formatUnits(order.amountIn, ctx.decimalsIn)}`;
  await notify(trade.webhookUrl, `✅ swap success (${order.mode}, ${amountLabel})\n${explorer.tx(tx.hash)}`);
}
