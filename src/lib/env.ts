/**
 * 環境変数の読み込み。
 *
 * - `.env` は Bun が自動で読み込む (dotenv 不要)
 * - `env/<name>.env` のプリセットを追加で読み込む (既存の値は上書きしない)
 *
 * 依存を増やさないため、プリセットのパースは最小限の自前実装にしている。
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

const loaded = new Set<string>();

/** `KEY=value` / `KEY="value"` / コメント行 のみをサポートする簡易パーサ */
export function parseEnvFile(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rest] = match as [string, string, string];
    let value = rest.trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) > 0) {
      value = value.slice(1, value.lastIndexOf(quote));
    } else {
      value = value.replace(/\s+#.*$/, "");
    }
    result[key] = value;
  }
  return result;
}

/** env/<name>.env を読み込む。プロセス環境・.env の値が優先される */
export function loadPreset(name: string): void {
  if (loaded.has(name)) return;
  const path = resolve(ROOT, "env", `${name}.env`);
  if (!existsSync(path)) {
    throw new Error(`プリセットが見つかりません: env/${name}.env`);
  }
  for (const [key, value] of Object.entries(parseEnvFile(readFileSync(path, "utf8")))) {
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
  loaded.add(name);
  console.log(`--- loaded preset: env/${name}.env ---`);
}

export function optional(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export function required(key: string): string {
  const value = optional(key);
  if (value === undefined || value === "xxx") {
    throw new Error(`環境変数 ${key} が設定されていません (.env を確認してください)`);
  }
  return value;
}

export function int(key: string, fallback?: number): number {
  const raw = optional(key);
  if (raw === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) throw new Error(`環境変数 ${key} は整数で指定してください: ${raw}`);
  return value;
}

export function flag(key: string): boolean {
  const raw = optional(key);
  return raw !== undefined && !["0", "false", "no"].includes(raw.toLowerCase());
}

export function list(key: string): string[] {
  return (optional(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const ROOT_DIR = ROOT;
