/**
 * 購入上限があるトークン向け。
 * 最初に成功した他人の Swap を検知し、その購入額が自分の AMOUNT より小さければ
 * 「上限がある」とみなして同じ受取数量を exactOut で注文する。
 */
import { formatUnits } from "ethers";
import { runForever } from "../../lib/cli.ts";
import { createTradeContext, getPairContract, sameAddress } from "../../lib/context.ts";
import { swap } from "../../lib/swap.ts";

runForever(async () => {
  const ctx = await createTradeContext({ side: "buy" });
  const pair = await getPairContract(ctx, ctx.tokenOut);
  const baseIsToken0 = sameAddress(await pair.getFunction("token0")(), ctx.chain.base);

  // 自分の購入額を基軸トークン (WBNB 等) 建てに換算しておく
  let myAmountInBase = ctx.amountIn;
  if (!sameAddress(ctx.tokenIn, ctx.chain.base)) {
    const amounts: bigint[] = await ctx.router.getFunction("getAmountsOut")(ctx.amountIn, [
      ctx.tokenIn,
      ctx.chain.base,
    ]);
    myAmountInBase = amounts[1] ?? 0n;
  }

  let detected = false;

  console.log(`Waiting first Swap on pair ${ctx.explorer.address(await pair.getAddress())} ...`);
  await pair.on(
    "Swap",
    async (_sender: string, amount0In: bigint, amount1In: bigint, amount0Out: bigint, amount1Out: bigint) => {
      const baseIn = baseIsToken0 ? amount0In : amount1In;
      const targetOut = baseIsToken0 ? amount1Out : amount0Out;
      // 売り方向の Swap は無視
      if (detected || baseIn === 0n) return;
      detected = true;
      console.log("💡💡💡 Got pair Swap event 💡💡💡");

      const limited = baseIn < myAmountInBase;
      if (limited) {
        console.log("⚡️⚡️⚡️ limit order ⚡️⚡️⚡️");
        console.log({
          observedBaseIn: formatUnits(baseIn, 18),
          myAmountInBase: formatUnits(myAmountInBase, 18),
          amountOut: targetOut.toString(),
        });
        await swap(ctx, { mode: "exactOut", amountOut: targetOut, amountInMax: ctx.amountIn });
      } else {
        await swap(ctx, { mode: "exactIn", amountIn: ctx.amountIn });
      }

      // TODO: AMOUNT を使い切るまで繰り返す
      process.exit(0);
    },
  );
});
