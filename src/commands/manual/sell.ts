/**
 * 保有している ADDRESS_TO を指定した割合だけ売却する。事前に `bun run approve:sell` が必要。
 *
 * `--fee-on-transfer` を付けるとデフレトークン用のメソッドで売却する
 * (トークンによっては使えないので注意)。
 */
import { formatUnits } from "ethers";
import { promptInt, runOnce } from "../../lib/cli.ts";
import { createTradeContext, erc20 } from "../../lib/context.ts";
import { swap } from "../../lib/swap.ts";

runOnce(async () => {
  const feeOnTransfer = process.argv.includes("--fee-on-transfer");
  const ctx = await createTradeContext({ side: "sell" });

  const balance: bigint = await erc20(ctx.tokenIn, ctx.provider).getFunction("balanceOf")(ctx.wallet.address);
  if (balance === 0n) throw new Error("売却するトークンを保有していません");

  const percent = promptInt("Input sell percent (1~100):", { min: 1, max: 100 });
  const amountIn = (balance * BigInt(percent)) / 100n;
  console.log({ balance: formatUnits(balance, ctx.decimalsIn), sell: formatUnits(amountIn, ctx.decimalsIn) });

  await swap(ctx, { mode: feeOnTransfer ? "exactInFeeOnTransfer" : "exactIn", amountIn });
});
