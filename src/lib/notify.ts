/** Slack 互換 Webhook に通知する。未設定なら何もしない。失敗しても処理は止めない */
export async function notify(webhookUrl: string | undefined, text: string): Promise<void> {
  if (!webhookUrl) return;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, link_names: 1 }),
    });
    if (!res.ok) console.warn(`webhook 通知に失敗しました: HTTP ${res.status}`);
  } catch (error) {
    console.warn("webhook 通知に失敗しました:", error);
  }
}
