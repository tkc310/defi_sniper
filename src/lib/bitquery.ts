/**
 * BitQuery GraphQL (v1) クライアント。
 * @see https://graphql.bitquery.io/ide
 */
import { resolve } from "node:path";
import { ROOT_DIR, loadPreset, required } from "./env.ts";

const ENDPOINT = "https://graphql.bitquery.io/";

export const SURVEY_OUTPUT_DIR = resolve(ROOT_DIR, "data/survey/outputs");
export const SURVEY_TARGETS_FILE = resolve(ROOT_DIR, "data/survey/targets.json");

export function loadSurveyEnv(): void {
  loadPreset("survey");
}

export async function bitquery<T>(query: string): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": required("BITQUERY_API_KEY"),
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`BitQuery HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors || !json.data) {
    throw new Error(`BitQuery error: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

/** survey 出力ファイル 1 行分 */
export type SurveyTx = {
  timestamp: string;
  tx: string;
  wallet: string;
};
