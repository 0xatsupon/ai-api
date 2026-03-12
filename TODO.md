# TODO - あなたがやること

## 完了
- [x] MetaMaskブラウザ拡張をインストール
- [x] MetaMaskでウォレット作成
- [x] アドレスをClaudeに共有 → .env更新済み
- [x] デプロイ先決定 → Render（無料枠）

## 今やること — GitHubリポジトリ作成
1. GitHub (https://github.com) でログイン
2. 右上の「+」→「New repository」
3. Repository name: `ai-api`
4. Private（推奨）を選択
5. 他はそのまま → 「Create repository」
6. 作成後、リポジトリURLをClaudeに共有

## その次 — Renderデプロイ（GitHub後）
1. https://render.com でアカウント作成（GitHub連携）
2. 「New Web Service」→ `ai-api` リポを選択
3. 設定:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: **Free**
4. 環境変数を追加:
   - `WALLET_ADDRESS` = `0xFB3A0085fa2e7852f24e96C49EA77e080bE55CAB`
   - `NETWORK` = `eip155:84532`
   - `FACILITATOR_URL` = `https://x402.org/facilitator`

## あとでやること
- [ ] Base Mainnetに切り替え（本番運用開始時）
- [ ] x402マーケットプレイス（RelAI等）に登録して集客

## メモ
- ウォレットアドレス: `0xFB3A0085fa2e7852f24e96C49EA77e080bE55CAB`
- envの更新やコード変更はClaudeがやる
