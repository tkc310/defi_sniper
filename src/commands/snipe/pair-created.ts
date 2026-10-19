/**
 * PairCreated (流動性ペア作成) を検知したら即購入する。基本はこれを使う。
 */
import { runForever } from "../../lib/cli.ts";
import { createTradeContext, sameAddress } from "../../lib/context.ts";
import { swap } from "../../lib/swap.ts";

runForever(async () => {
  const ctx = await createTradeContext({ side: "buy" });
  const target = ctx.tokenOut;

  // 二重購入を防ぐため、一度マッチしたら以降のイベントは無視する
  let state: "waiting" | "buying" = "waiting";

  console.log(`Waiting PairCreated for ${ctx.explorer.token(target)} ...`);
  await ctx.factory.on("PairCreated", async (token0: string, token1: string, pair: string) => {
    if (state !== "waiting") return;

    const created = sameAddress(token0, ctx.chain.base) ? token1 : token0;
    const matched = sameAddress(created, target);
    console.log(
      [
        "==========================================",
        `New pair detected - ${matched ? "💡💡💡 Matched 💡💡💡" : "No Match"}`,
        "------------------------------------------",
        `Token: ${ctx.explorer.token(created)}`,
        `Pair:  ${ctx.explorer.address(pair)}`,
      ].join("\n"),
    );
    if (!matched) return;

    state = "buying";
    await swap(ctx, { mode: "exactIn", amountIn: ctx.amountIn });
    console.log("Your token was bought!");
    process.exit(0);
  });
});
