/** ADDRESS_TO のペアへの流動性追加 (Mint) を監視して表示するだけ (注文しない) */
import { getAddress, type ContractEventPayload } from "ethers";
import { runForever } from "../../lib/cli.ts";
import { createReadContext, getPairContract } from "../../lib/context.ts";
import { required } from "../../lib/env.ts";

runForever(async () => {
  const ctx = createReadContext();
  const pair = await getPairContract(ctx, getAddress(required("ADDRESS_TO")));

  console.log("Subscribing pair Mint ...");
  await pair.on("Mint", (sender: string, amount0: bigint, amount1: bigint, event: ContractEventPayload) => {
    console.log("💡💡💡 Got pair Mint event 💡💡💡");
    console.log({ sender, amount0, amount1 });
    console.log(`Tx: ${ctx.explorer.tx(event.log.transactionHash)}`);
  });
});
