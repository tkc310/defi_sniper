/**
 * Router にトークンの使用を許可する。
 *   bun run approve:buy  … 購入に使う ADDRESS_FROM を approve (DEX ごとに初回のみ)
 *   bun run approve:sell … 売却する ADDRESS_TO を approve (購入後に実行)
 *
 * ⚠️ 速度優先で無制限 (MaxUint256) の approve を行う。bot 専用ウォレットで使うこと。
 */
import { MaxUint256, parseUnits } from "ethers";
import { runOnce } from "../../lib/cli.ts";
import { createTradeContext, erc20, type Side } from "../../lib/context.ts";

runOnce(async () => {
  const side = process.argv[2] as Side | undefined;
  if (side !== "buy" && side !== "sell") {
    throw new Error("使い方: bun src/commands/manual/approve.ts <buy|sell>");
  }

  const ctx = await createTradeContext({ side });
  const token = erc20(ctx.tokenIn, ctx.wallet);
  const spender = ctx.chain.router;

  if (ctx.trade.dryRun) {
    console.log("--- DRY_RUN: approve は送信しません ---");
    console.log({ token: ctx.tokenIn, spender });
    return;
  }

  console.log(`Approving ${ctx.explorer.token(ctx.tokenIn)} for router ${spender} ...`);
  const tx = await token.getFunction("approve")(spender, MaxUint256, {
    gasLimit: ctx.trade.approveGasLimit,
    gasPrice: parseUnits(ctx.trade.approveGasPriceGwei, "gwei"),
  });
  console.log(`Tx: ${ctx.explorer.tx(tx.hash)}`);
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) throw new Error("approve が失敗しました");
  console.log("Approve Success 🎉🎉🎉");
});
