/** AMOUNT 分の ADDRESS_FROM で ADDRESS_TO を購入する */
import { runOnce } from "../../lib/cli.ts";
import { createTradeContext } from "../../lib/context.ts";
import { swap } from "../../lib/swap.ts";

runOnce(async () => {
  const ctx = await createTradeContext({ side: "buy" });
  await swap(ctx, { mode: "exactIn", amountIn: ctx.amountIn });
});
