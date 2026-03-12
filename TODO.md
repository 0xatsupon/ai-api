# TODO - あなたがやること

## 完了
- [x] MetaMask & ウォレット作成
- [x] Renderデプロイ完了 & 動作確認OK
- [x] AIエージェント向けAPI発見機能を強化（Claude実施済み）
- [x] Mainnet切り替え試行 → Facilitator未対応のため保留

## 今やること
- [ ] Renderで環境変数を変更してMainnet切り替え:
  - `FACILITATOR_URL` → `https://facilitator.xpay.sh`（または削除）
  - `NETWORK` → `eip155:8453`
- [ ] Mainnet動作確認（/api/health → OK、/api/v1/echo → 402にMainnet情報）
- [ ] x402マーケットプレイス（x402dev.com等）に登録してAIエージェントに発見してもらう
- [ ] GitHubリポにx402タグ追加

## メモ
- 本番URL: https://ai-api-1c5n.onrender.com
- ウォレットアドレス: `0xFB3A0085fa2e7852f24e96C49EA77e080bE55CAB`
- GitHubリポ: https://github.com/0xatsupon/ai-api (Private)
- Facilitator: XPay (`https://facilitator.xpay.sh`) — Base Mainnet対応済み
- ランニングコスト: $0/月
- Mainnet移行: Render環境変数2つ変更するだけ（上記参照）
