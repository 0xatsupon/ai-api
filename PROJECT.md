# ai-api: x402 API課金サーバー

## これは何？

**x402プロトコル**を使って、APIリクエストごとにUSDC（暗号通貨）で自動課金できるAPIサーバー。
アカウント登録・APIキー・サブスク管理が不要で、リクエスト単位の即時決済が可能。

---

## 仕組み（図解）

```
クライアント（AIエージェント等）
    │
    │  1. POST /api/v1/echo  (支払いなし)
    ▼
あなたのAPIサーバー (このプロジェクト)
    │
    │  2. HTTP 402 返却 + PAYMENT-REQUIREDヘッダー
    │     「$0.001のUSDCを払ってね」
    ▼
クライアント
    │
    │  3. USDCで支払い署名を作成 → X-PAYMENTヘッダー付きで再リクエスト
    ▼
APIサーバー → Facilitator (Coinbase)
    │
    │  4. 支払い検証OK → あなたのウォレットにUSDC送金
    ▼
APIサーバー
    │
    │  5. APIレスポンスを返却
    ▼
あなたのウォレットにUSDCが入る！
```

---

## ファイル構成

```
ai-api/
├── src/
│   ├── index.ts              ← サーバー起動（エントリーポイント）
│   ├── config.ts             ← 設定（ウォレット, ネットワーク, Facilitator URL）
│   ├── middleware/
│   │   ├── x402.ts           ← x402決済ミドルウェア（ここで価格・ルート設定）
│   │   └── logger.ts         ← リクエストログ（[FREE]/[PAID]/[402]タグ付き）
│   └── routes/
│       ├── public.ts         ← 無料エンドポイント（/api/health, /api/info）
│       └── paid.ts           ← 有料エンドポイント（/api/v1/echo 等）
├── .env.example              ← 環境変数テンプレート（コピーして.envを作る）
├── .gitignore
├── tsconfig.json
├── package.json
└── PROJECT.md                ← この資料
```

---

## エンドポイント一覧

| メソッド | パス | 課金 | 価格 | 説明 |
|----------|------|------|------|------|
| GET | /api/health | 無料 | - | ヘルスチェック |
| GET | /api/info | 無料 | - | API情報・利用可能エンドポイント一覧 |
| POST | /api/v1/echo | 有料 | $0.001 | 送ったデータをそのまま返す |
| POST | /api/v1/text/transform | 有料 | $0.001 | テキスト変換（uppercase, lowercase, reverse, camelCase等） |
| POST | /api/v1/text/analyze | 有料 | $0.002 | テキスト分析（文字数, 単語数, 文数, 頻出文字等） |
| POST | /api/v1/data/json-transform | 有料 | $0.002 | JSON変換（flatten, pick, omit, keys, values） |
| POST | /api/v1/crypto/hash | 有料 | $0.001 | ハッシュ生成（SHA-256, SHA-512, MD5, SHA-1） |
| POST | /api/v1/util/uuid | 有料 | $0.001 | UUID生成（1〜100個） |

---

## 使い方

### 1. セットアップ

```bash
# パッケージインストール（初回のみ）
npm install

# .envファイルを作成
cp .env.example .env
# → .envを編集してWALLET_ADDRESSにあなたのウォレットアドレスを設定
```

### 2. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でサーバーが起動する。

### 3. 動作確認

```bash
# 無料エンドポイント → 200 OK
curl http://localhost:3000/api/health

# 有料エンドポイント → 402 Payment Required
curl -X POST http://localhost:3000/api/v1/echo \
  -H "Content-Type: application/json" \
  -d '{"msg":"hello"}'
```

### 4. ビルド & 本番起動

```bash
npm run build   # TypeScriptをコンパイル
npm start       # コンパイル済みJSで起動
```

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| 言語 | TypeScript |
| ランタイム | Node.js |
| フレームワーク | Express.js |
| 決済プロトコル | x402 (v2) |
| ブロックチェーン | Base Sepolia (テストネット) |
| 決済通貨 | USDC |
| Facilitator | Coinbase公式 (x402.org) |
| x402パッケージ | @x402/express, @x402/core, @x402/evm |

---

## 設定の変更方法

### 各APIの使い方（リクエスト例）

**Text Transform:**
```json
POST /api/v1/text/transform
{"text": "hello world", "operation": "uppercase"}
// → {"result": "HELLO WORLD", "operation": "uppercase"}
// operations: uppercase, lowercase, reverse, trim, capitalize, camelCase, snakeCase, kebabCase
```

**Text Analyze:**
```json
POST /api/v1/text/analyze
{"text": "Hello world. This is a test."}
// → {"characters": 28, "words": 6, "sentences": 2, ...}
```

**JSON Transform:**
```json
POST /api/v1/data/json-transform
{"data": {"a": {"b": 1}}, "operation": "flatten"}
// → {"result": {"a.b": 1}}
// operations: flatten, pick, omit, keys, values
// pick/omitにはfieldsパラメータが必要: {"data": {...}, "operation": "pick", "fields": ["name"]}
```

**Hash:**
```json
POST /api/v1/crypto/hash
{"input": "hello", "algorithm": "sha256"}
// → {"hash": "2cf24dba...", "algorithm": "sha256"}
// algorithms: sha256, sha512, md5, sha1
```

**UUID:**
```json
POST /api/v1/util/uuid
{"count": 3}
// → {"uuids": ["uuid1", "uuid2", "uuid3"], "count": 3}
```

### 新しい有料エンドポイントを追加するには

**1. `src/middleware/x402.ts` の `routes` に追加:**
```typescript
const routes = {
  "POST /api/v1/echo": { ... },  // 既存
  "POST /api/v1/your-new-api": {  // ← 追加
    accepts: {
      scheme: "exact" as const,
      price: "$0.01",              // 価格を設定
      network,
      payTo: config.walletAddress,
    },
    description: "Your new API description",
  },
};
```

**2. `src/routes/paid.ts` にルートハンドラを追加:**
```typescript
router.post("/api/v1/your-new-api", (req, res) => {
  // ここにAPIのロジックを書く
  res.json({ result: "..." });
});
```

### テストネット → 本番ネットに切り替えるには

`.env` ファイルを変更:
```
NETWORK=eip155:8453          # Base Mainnet
WALLET_ADDRESS=0xあなたの本番ウォレットアドレス
```

---

## 収益構造

```
収入: APIリクエスト × 1リクエストの価格（自分で設定）
支出: サーバー費 ($5〜20/月) + Facilitator費 (月1,000件まで無料)

例: 月10,000リクエスト × $0.01 = $100/月
```

---

## 市場分析サマリー

- **x402市場**: まだ黎明期（日次取引量〜$28,000）だが急成長中
- **バッカー**: Coinbase, Cloudflare, Stripe（強力）
- **初期投資リスク**: 極めて低い（月$5〜20）
- **最大損失**: 6ヶ月運営しても約$130 + 開発時間
- **鍵**: 提供するAPIの価値（ユニークで需要あるものが必要）

詳しい市場分析は `.claude/plans/mighty-mapping-balloon.md` にあり。

---

## 次にやるべきこと

1. [ ] `.env` にあなたのウォレットアドレスを設定
2. [ ] 実際に価値ある有料APIを考えて実装する
3. [ ] VPS等にデプロイ（Render, Railway, VPS等）
4. [ ] Base Mainnetに切り替えて本番運用開始
5. [ ] RelAI等のx402マーケットプレイスに登録して集客
6. [ ] 3ヶ月後にトラクション評価 → 拡大 or 撤退を判断
