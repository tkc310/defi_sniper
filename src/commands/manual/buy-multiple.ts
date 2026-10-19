/** MULTIPLE_AMOUNT ずつ、入力した回数だけ連続で購入する (購入上限があるトークン向け) */
import { promptInt, runOnce } from "../../lib/cli.ts";
import { createTradeContext } from "../../lib/context.ts";
import { swap } from "../../lib/swap.ts";

runOnce(async () => {
  const count = promptInt("Input exec count:", { min: 1, max: 1000 });
  const ctx = await createTradeContext({ side: "buy", amount: "multiple" });

  for (let i = 1; i <= count; i++) {
    console.log(`--- ${i} / ${count} ---`);
    await swap(ctx, { mode: "exactIn", amountIn: ctx.amountIn });
  }
});
