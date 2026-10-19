/**
 * 指定トークンへの transferFrom 呼び出しを時系列順に取得し、
 * 初動で買っているウォレットを data/survey/outputs/tx_survey_<SUFFIX>.json に保存する。
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { SURVEY_OUTPUT_DIR, bitquery, loadSurveyEnv, type SurveyTx } from "../../lib/bitquery.ts";
import { runOnce } from "../../lib/cli.ts";
import { required } from "../../lib/env.ts";

type Response = {
  ethereum: {
    smartContractCalls: {
      block: { timestamp: { time: string } };
      transaction: { hash: string; txFrom: { address: string } };
    }[];
  };
};

runOnce(async () => {
  loadSurveyEnv();
  const token = required("SURVEY_TOKEN");
  const since = required("SURVEY_DATE_FROM");
  const till = required("SURVEY_DATE_TO");
  const suffix = required("SURVEY_OUTPUT_SUFFIX");

  const data = await bitquery<Response>(`query {
    ethereum(network: bsc) {
      smartContractCalls(
        options: {asc: "block.timestamp.time", limit: 50}
        date: {since: "${since}", till: "${till}"}
        smartContractAddress: {is: "${token}"}
        smartContractMethod: {is: "transferFrom"}
      ) {
        block { timestamp { time(format: "%Y-%m-%d %H:%M:%S") } }
        transaction { hash txFrom { address } }
      }
    }
  }`);

  const outputs: SurveyTx[] = data.ethereum.smartContractCalls.map((call) => ({
    timestamp: call.block.timestamp.time,
    tx: call.transaction.hash,
    wallet: call.transaction.txFrom.address,
  }));
  console.log(outputs);

  await mkdir(SURVEY_OUTPUT_DIR, { recursive: true });
  const path = resolve(SURVEY_OUTPUT_DIR, `tx_survey_${suffix}.json`);
  await Bun.write(path, JSON.stringify(outputs, null, 2));
  console.log(`--- saved: ${path} ---`);
});
