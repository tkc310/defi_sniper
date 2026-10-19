/** コマンドのエントリポイント共通処理 */

function formatError(error: unknown): string {
  if (error instanceof Error) {
    // ethers のエラーは shortMessage の方が読みやすい
    const short = (error as { shortMessage?: string }).shortMessage;
    return short ?? error.message;
  }
  return String(error);
}

function fail(error: unknown): never {
  console.error("--- Failed ---\n", formatError(error));
  process.exit(1);
}

process.on("unhandledRejection", fail);

/**
 * 一度きりのコマンド。完了したら終了コード 0 で終了する。
 */
export function runOnce(fn: () => Promise<void>): void {
  fn().then(() => process.exit(0), fail);
}

/**
 * イベント購読などで常駐するコマンド。fn はリスナー登録後に resolve すればよく、
 * 終了は fn 内で process.exit() を呼ぶか Ctrl+C で行う。
 */
export function runForever(fn: () => Promise<void>): void {
  fn().catch(fail);
}

/** 数値入力を受け付ける (Bun 組み込みの prompt を利用) */
export function promptInt(question: string, range: { min: number; max: number }): number {
  for (;;) {
    const answer = prompt(question);
    if (answer === null) throw new Error("入力がキャンセルされました");
    const value = Number.parseInt(answer, 10);
    if (!Number.isNaN(value) && value >= range.min && value <= range.max) return value;
    console.log(`${range.min}〜${range.max} の数値を入力してください`);
  }
}
