# defi_sniper

[![CI](https://github.com/tkc310/defi_sniper/actions/workflows/ci.yml/badge.svg)](https://github.com/tkc310/defi_sniper/actions/workflows/ci.yml)
![Bun](https://img.shields.io/badge/runtime-Bun%20%E2%89%A5%201.3-f9f1e1?logo=bun&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![ethers](https://img.shields.io/badge/ethers-v6%20(pinned)-2535a0)
![runtime deps](https://img.shields.io/badge/runtime%20deps-1-brightgreen)
![chains](https://img.shields.io/badge/chains-BSC%20%7C%20Avalanche-f0b90b)

Uniswap V2 互換 DEX 向けのトレーディング bot です。流動性追加のタイミングで素早くトークンを購入できます。
Node.js / npm / tsc のセットアップは不要で、**Bun だけで動きます**。

> [!WARNING]
> 利用しなくなったため公開しているコードです。現在も優位性があるかは分かりません。**利用は自己責任**でお願いします。
> 無償公開のため、利用方法に関する問い合わせは受け付けていません。

## 機能

- **スナイプ** — `PairCreated` / `Mint` を検知した瞬間に購入
- **購入上限トークン対策** — 直前に成功した他人の Swap をコピーして同じ数量を注文 (`snipe:swap-trace`) / 少額ずつ連続購入 (`buy:multiple`)
- **ハニーポット対策** — 少額で売買できるか事前に確認する運用を想定 (`buy` → `approve:sell` → `sell`)
- **マルチチェーン** — PancakeSwap / BakerySwap (BSC)、Pangolin (Avalanche C-Chain)。Router / Factory のアドレスを変えれば他の V2 フォークにも流用可
- **調査** — BitQuery API で初動購入ウォレットを追跡

## セットアップ

```sh
# 1. Bun をインストール (https://bun.com)
curl -fsSL https://bun.com/install | bash

# 2. 依存をインストール (bun.lock どおりに入る。下記「セキュリティ」参照)
bun install
#    ※ bun.lock がまだ無い場合のみ、初回だけ以下で生成してコミットする
#    bun install --no-frozen-lockfile && git add bun.lock

# 3. 設定ファイルを作成して編集
cp .env.example .env
```

`.env` の主な項目 (全項目は [`.env.example`](.env.example) を参照):

| 変数 | 説明 |
| --- | --- |
| `DEX` | `pancake` \| `bakery` \| `pangolin`。`env/<DEX>.env` のプリセットを読み込む |
| `ADDRESS_FROM` | 支払いに使うトークン (例: BUSD, WBNB) |
| `ADDRESS_TO` | 購入したいトークン |
| `AMOUNT` | 1 回の購入で使う `ADDRESS_FROM` の数量 |
| `TRADE_GAS_LIMIT` / `TRADE_GAS_PRICE` | 売買のガス (price は gwei) |
| `PRIVATE_KEY` | bot 用ウォレットの秘密鍵 |
| `WS_RPC_URL` | 設定すると WebSocket で購読し、検知が速くなる (API キー入り URL はここに書く) |
| `DRY_RUN` | `1` でトランザクションを送信せず内容だけ表示 |

Router / Factory / RPC などのチェーン固有の値は [`env/`](env) のプリセットにあります。各種アドレスは [`docs/addresses.md`](docs/addresses.md) にまとめています。

## 使い方

| コマンド | 内容 |
| --- | --- |
| `bun run snipe:pair-created` | **基本はこれ。** 対象トークンの `PairCreated` を検知したら購入 |
| `bun run snipe:mint` | 既存ペアへの流動性追加 (`Mint`) で購入。BSCPAD 等のローンチパッド IDO や、`PairCreated` が出ない BakerySwap 向け |
| `bun run snipe:swap-trace` | 最初の他人の Swap を見て、購入上限があればその数量で exactOut 注文 |
| `bun run buy` | 任意のタイミングで `AMOUNT` 分購入 |
| `bun run buy:multiple` | `MULTIPLE_AMOUNT` ずつ指定回数購入 |
| `bun run sell` | 保有量の指定 % を売却 (`bun run sell --fee-on-transfer` でデフレトークン用メソッド) |
| `bun run approve:buy` | 購入に使う `ADDRESS_FROM` を Router に approve (DEX ごとに初回のみ) |
| `bun run approve:sell` | 購入した `ADDRESS_TO` を Router に approve (売却前に必要) |
| `bun run subscribe:pair-created` | `PairCreated` を表示するだけ。`WATCH_SYMBOLS` で未公開トークンを捜索 |
| `bun run subscribe:mint` / `subscribe:swap` | 対象ペアのイベントを表示するだけ |
| `bun run survey:tx` | BitQuery で初動購入ウォレットを取得し `data/survey/outputs/` に保存 |
| `bun run survey:find-wallets` | 上記出力を突き合わせ、複数トークンで初動購入しているウォレットを抽出 |
| `bun run survey:wallet-tx` | `data/survey/targets.json` のウォレットが公開前にトークンを受け取った回数を集計 |

単発で DEX を切り替える場合は `DEX=pangolin bun run buy` のように環境変数で上書きできます。
survey 系は `.env` に `BITQUERY_API_KEY` を、`env/survey.env` に対象を設定してください (BitQuery v1 GraphQL API を使用しているため、現在も使えるかは未確認です)。

## 基本的な流れ

1. フェアローンチ予定のトークンのコントラクトアドレスを事前に調べる
2. `https://poocoin.app/tokens/<address>` などでチャートを開いておく
3. `.env` の `ADDRESS_TO` に設定する
4. その DEX で初めて買う場合は `bun run approve:buy`
5. ローンチ予定の 5〜10 分前に `bun run snipe:pair-created` を起動して待機
6. 購入できたら `bun run approve:sell`
7. 任意のタイミングで `bun run sell` (多くの bot が 5 分過ぎに動くため、3〜4 分後が良いことが多かった)

## セキュリティ

### 秘密鍵

- **bot 専用の新規ウォレット**を作り、必要最小限の資金だけ入れてください。メインウォレットの鍵は絶対に使わないでください
- `approve` は速度優先で無制限 (MaxUint256) 許可を行います。使い終わったら [revoke.cash](https://revoke.cash) などで取り消せます
- `.env` は `.gitignore` 済みです。RPC プロバイダの API キーも `env/*.env` ではなく `.env` に書いてください

### サプライチェーン攻撃への対策

暗号資産を扱うパッケージは、秘密鍵やウォレットを盗む目的のサプライチェーン攻撃の主要な標的になっています。

- 2024 年 12 月、公式の `@solana/web3.js` が乗っ取られ、秘密鍵を外部へ送信するバックドア入りのバージョンが数時間公開されました ([The Hacker News](https://thehackernews.com/2024/12/researchers-uncover-backdoor-in-solanas.html), [The Register](https://www.theregister.com/2024/12/05/solana_javascript_sdk_compromised/))
- 2025 年 3 月、`ethers-provider2` などの悪性パッケージが、ローカルにインストール済みの正規の `ethers` のファイルを書き換えてリバースシェルを仕込む手口が報告されました。悪性パッケージを消しても改ざんされた `ethers` は残ります ([The Hacker News](https://thehackernews.com/2025/03/malicious-npm-package-modifies-local.html), [ReversingLabs](https://reversinglabs.com/blog/malicious-npm-patch-delivers-reverse-shell))
- 2025 年 9 月、`chalk` や `debug` など週 20 億 DL 規模の定番パッケージがメンテナのフィッシング被害で乗っ取られ、ブラウザ上の暗号資産の送金先を書き換えるコードが混入しました ([The Hacker News](https://thehackernews.com/2025/09/20-popular-npm-packages-with-2-billion.html))
- 同月以降、npm トークンや認証情報を盗んで自己増殖するワーム「Shai-Hulud」が数百パッケージに広がり、11 月には第 2 波も確認されています ([Infosecurity Magazine](https://www.infosecurity-magazine.com/news/supply-chain-worm-hundreds-npm/), [InfoWorld](https://www.infoworld.com/article/4095604/new-shai-hulud-worm-spreading-through-npm-github-2.html))

このリポジトリでは以下の対策をしています。

| 対策 | 内容 |
| --- | --- |
| 依存の最小化 | 旧版の `web3` / `node-fetch` / `dotenv` / `@pancakeswap-libs/sdk` を削除し、実行時依存は `ethers` のみ。`fetch` / `.env` 読込 / 入力プロンプトは Bun 組み込み機能で代替 |
| バージョン完全固定 | `package.json` は `^` なしで固定、`bunfig.toml` の `exact = true` で今後の `bun add` も固定 |
| lockfile 固定 | `bunfig.toml` の `frozenLockfile = true` と CI の `bun ci` で、`bun.lock` と異なるバージョンは入らない |
| 公開直後のバージョンを拒否 | `minimumReleaseAge` で公開から 7 日未満のバージョンをインストールしない。乗っ取り版は多くが数時間〜数日で削除されるため、その期間を避ける |
| install script を実行しない | Bun は既定で依存パッケージの lifecycle script (postinstall 等) を実行しない。`trustedDependencies` は空のまま維持する |
| 継続監視 | CI で `bun audit`、Dependabot も 7 日のクールダウン付きで更新 PR を作成 |

運用時の注意:

- **タイポスクワッティングに注意** — `ethers-provider2` のような「それっぽい名前」のパッケージを追加しない。追加前に npm のページで公開者・DL 数・リポジトリを確認する
- **`trustedDependencies` に追加しない** — install script が必要なパッケージは本プロジェクトには不要です
- **更新は差分を見てから** — 依存を上げるときは `bun outdated` で確認し、リリースノートと `bun.lock` の差分をレビューする。急ぎでなければクールダウン期間を待つ
- **鍵を持つマシンを分ける** — 可能なら bot の実行環境は開発用マシンと分け、秘密鍵を置くマシンで不要なパッケージをインストールしない

参考: [Bun — bun install (minimumReleaseAge / trustedDependencies / frozenLockfile)](https://bun.com/docs/pm/cli/install)

## ディレクトリ構成

```
src/
  commands/
    snipe/      # イベント検知 → 自動購入
    manual/     # 手動売買・approve
    subscribe/  # イベント監視のみ
    survey/     # BitQuery によるウォレット調査
  lib/          # 設定読込・コントラクト・swap などの共通処理
env/            # DEX ごとのプリセット (Router / Factory / RPC)
data/survey/    # survey の入力 (targets.json) と出力 (outputs/, git 管理外)
docs/           # アドレスメモ
```

## 開発

```sh
bun run typecheck   # tsc --noEmit
bun run deps:check  # bun audit && bun outdated
```

---

## English

A sniping / trading bot for Uniswap V2 compatible DEXes (PancakeSwap, BakerySwap, Pangolin). It buys a token right when liquidity is added. Runs on **Bun only** — no Node.js, npm or tsc setup required.

```sh
bun install
cp .env.example .env   # edit it
bun run snipe:pair-created
```

See the command table above for all scripts. This code is published as-is since I no longer use it; use it at your own risk. No support is provided.

The only runtime dependency is `ethers` (exact-pinned). Installs are locked to `bun.lock`, versions younger than 7 days are rejected (`minimumReleaseAge`), and dependency lifecycle scripts are never run — see the Security section above for the supply-chain incidents that motivated this.
