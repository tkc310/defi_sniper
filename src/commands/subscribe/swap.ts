/** ADDRESS_TO のペアの Swap を監視して表示するだけ (注文しない) */
import { getAddress, type ContractEventPayload } from "ethers";
import { runForever } from "../../lib/cli.ts";
import { createReadContext, getPairContract } from "../../lib/context.ts";
import { required } from "../../lib/env.ts";

runForever(async () => {
  const ctx = createReadContext();
  const pair = await getPairContract(ctx, getAddress(required("ADDRESS_TO")));

  console.log("Subscribing pair Swap ...");
  await pair.on(
    "Swap",
    (
      sender: string,
      amount0In: bigint,
      amount1In: bigint,
      amount0Out: bigint,
      amount1Out: bigint,
      to: string,
      event: ContractEventPayload,
    ) => {
      console.log("💡💡💡 Got pair Swap event 💡💡💡");
      console.log({ sender, amount0In, amount1In, amount0Out, amount1Out, to });
      console.log(`Tx: ${ctx.explorer.tx(event.log.transactionHash)}`);
    },
  );
});
