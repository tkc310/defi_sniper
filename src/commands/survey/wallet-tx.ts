/**
 * data/survey/targets.json に列挙したウォレットが、各トークンの公開時刻より前に
 * そのトークンを受け取っていた回数を数える (インサイダー判定の目安)。
 */
import { SURVEY_TARGETS_FILE, bitquery, loadSurveyEnv } from "../../lib/bitquery.ts";
import { runOnce } from "../../lib/cli.ts";
import { required } from "../../lib/env.ts";

type Targets = {
  wallets: string[];
  tokens: { address: string; published: string }[];
};

type Response = {
  ethereum: {
    transfers: { block: { timestamp: { time: string } }; transaction: { hash: string }; amount: number }[];
  };
};

runOnce(async () => {
  loadSurveyEnv();
  const since = required("SURVEY_WALLET_TX_SINCE");
  const targets = (await Bun.file(SURVEY_TARGETS_FILE).json()) as Targets;

  const results: { wallet: string; earlyReceives: number }[] = [];

  for (const wallet of targets.wallets) {
    let earlyReceives = 0;
    for (const token of targets.tokens) {
      const data = await bitquery<Response>(`query {
        ethereum(network: bsc) {
          transfers(
            options: {desc: "block.timestamp.time"}
            date: {since: "${since}", till: null}
            amount: {gt: 0}
            receiver: {is: "${wallet}"}
            currency: {is: "${token.address}"}
          ) {
            block { timestamp { time(format: "%Y-%m-%d %H:%M:%S") } }
            transaction { hash }
            amount
          }
        }
      }`);

      for (const tx of data.ethereum.transfers) {
        const early = tx.block.timestamp.time <= token.published;
        if (early) earlyReceives++;
        console.log({ token: token.address, tx: tx.block.timestamp.time, published: token.published, early });
      }
    }
    console.log({ wallet, earlyReceives });
    results.push({ wallet, earlyReceives });
  }

  console.table(results);
});
