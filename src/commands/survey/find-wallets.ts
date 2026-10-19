/**
 * survey:tx の出力 (data/survey/outputs/tx_survey_*.json) を突き合わせ、
 * 複数のトークンで初動購入しているウォレット (= 他の bot / インサイダー候補) を抽出する。
 */
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { SURVEY_OUTPUT_DIR, type SurveyTx } from "../../lib/bitquery.ts";
import { runOnce } from "../../lib/cli.ts";

runOnce(async () => {
  const files = (await readdir(SURVEY_OUTPUT_DIR)).filter((f) => /^tx_survey_.+\.json$/.test(f));
  if (files.length === 0) throw new Error(`${SURVEY_OUTPUT_DIR} に survey:tx の出力がありません`);

  // wallet -> 出現したシンボル
  const hits = new Map<string, Set<string>>();
  for (const file of files) {
    const symbol = file.replace(/^tx_survey_/, "").replace(/\.json$/, "");
    const txs = (await Bun.file(resolve(SURVEY_OUTPUT_DIR, file)).json()) as SurveyTx[];
    for (const { wallet } of txs) {
      const key = wallet.toLowerCase();
      hits.set(key, (hits.get(key) ?? new Set()).add(symbol));
    }
  }

  const repeated = [...hits]
    .filter(([, symbols]) => symbols.size > 1)
    .sort((a, b) => b[1].size - a[1].size)
    .map(([wallet, symbols]) => ({ wallet, count: symbols.size, symbols: [...symbols] }));

  console.table(repeated);
  console.log(`files: ${files.length}, wallets appearing in 2+ tokens: ${repeated.length}`);
});
