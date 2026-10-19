/**
 * 既存ペアへの流動性追加 (Mint) を検知したら即購入する。
 * BSCPAD などのローンチパッド経由の IDO や、PairCreated が発行されない DEX (BakerySwap 等) 向け。
 */
import { runForever } from "../../lib/cli.ts";
import { createTradeContext, getPairContract } from "../../lib/context.ts";
import { swap } from "../../lib/swap.ts";

runForever(async () => {
  const ctx = await createTradeContext({ side: "buy" });
  const pair = await getPairContract(ctx, ctx.tokenOut);

  let bought = false;

  console.log(`Waiting Mint on pair ${ctx.explorer.address(await pair.getAddress())} ...`);
  await pair.on("Mint", async () => {
    if (bought) {
      console.log("Second mint event detected (ignored)");
      return;
    }
    bought = true;
    console.log("💡💡💡 Got pair Mint event 💡💡💡");

    await swap(ctx, { mode: "exactIn", amountIn: ctx.amountIn });
    process.exit(0);
  });
});
