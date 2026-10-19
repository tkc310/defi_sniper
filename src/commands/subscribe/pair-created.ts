/**
 * PairCreated を監視して新規トークンを表示するだけ (注文しない)。新しい DEX やローンチパッドの調査用。
 *   - WATCH_SYMBOLS に一致するシンボル (未公開コントラクトアドレスの捜索用)
 *   - ADDRESS_TO と一致するアドレス
 * を検知すると強調表示する。
 */
import { getAddress } from "ethers";
import { runForever } from "../../lib/cli.ts";
import { createReadContext, erc20, sameAddress } from "../../lib/context.ts";
import { list, optional } from "../../lib/env.ts";

runForever(async () => {
  const ctx = createReadContext();
  const watchSymbols = list("WATCH_SYMBOLS").map((s) => new RegExp(s, "i"));
  const targetRaw = optional("ADDRESS_TO");
  const target = targetRaw ? getAddress(targetRaw) : undefined;

  console.log("Subscribing PairCreated ...");
  await ctx.factory.on("PairCreated", async (token0: string, token1: string) => {
    const created = sameAddress(token0, ctx.chain.base) ? token1 : token0;
    const token = erc20(created, ctx.provider);
    const [name, symbol] = await Promise.all([
      token.getFunction("name")().catch(() => "?"),
      token.getFunction("symbol")().catch(() => "?"),
    ]);
    console.log(`name: ${String(name).trim()} - symbol: ${String(symbol).trim()}`);

    if (watchSymbols.some((re) => re.test(String(symbol)))) {
      console.log(`💡💡💡 Probably matched symbol: ${symbol}\n${ctx.explorer.token(created)}`);
    }
    if (target && sameAddress(created, target)) {
      console.log(`💡💡💡 Matched address\n${ctx.explorer.token(created)}`);
    }
  });
});
