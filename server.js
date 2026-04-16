/* ============================================
   Me Treat - AIチャットボット バックエンドサーバー
   Claude API（Anthropic）を使用したSSEストリーミング対応
   ============================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Anthropic クライアント初期化 ---------- */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/* ---------- ミドルウェア設定 ---------- */
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'null'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

/* ---------- 静的ファイル配信（index.html等） ---------- */
app.use(express.static(__dirname));

/* ---------- Me Treat AIアシスタントのシステムプロンプト ---------- */
const SYSTEM_PROMPT = `あなたは「Me Treat」の公式AIアシスタントです。
さとう式リンパケアインストラクター Elymph（エリンフ）が運営するウェブサイトのチャットボットとして、訪問者のご質問に丁寧にお答えします。

【Me Treatについて】
さとう式リンパケアインストラクターのElymphが愛知県で運営するサロン・スクールです。
オンラインで全国対応しています。
サイト名「Me Treat」には「今日から、私が一番大事。」というコンセプトが込められています。

【さとう式リンパケアについて】
- 「頑張ったら破門」という有名な教えがあります。力を入れれば入れるほど体は緊張するため、ゆるめることがケアの本質です。
- 「生まれ変わりのケア」とも呼ばれ、体の深部からゆるんでいきます。
- 押す・揉む・強くするのではなく、触れるか触れないかの優しさで体が変わります。
- 体と心の両方をゆるめることができる、全く新しいアプローチです。

【講座案内】
▶ セルフケアマスター養成講座（人気No.1）
　・受講料：¥165,000〜（税込）
　・講座時間：6時間 × 3日間
　・受講資格なし、どなたでも参加可能
　・修了後は講師として開講できる
　・オンライン受講OK
　・美容ケア・不調解消ケアを網羅

▶ ビューティーカフ基礎講座
　・受講料：¥15,000〜（税込）、再受講¥7,500〜
　・講座時間：2.5時間
　・受講資格なし、どなたでも参加可能
　・オンライン受講OK
　・世界にひとつのイヤーカフを手作りできる
　・再受講制度あり（半額）

【イヤーカフについて】
さとう式リンパケアのために生まれた特別なイヤーカフです。ケアしながらおしゃれも楽しめます。
- シンプルイヤーカフ：¥6,600（税込）
- テラヘルツイヤーカフ：¥7,700（税込）
- チャーム（別売り）：価格はオンラインショップでご確認ください
購入はオンラインショップ（BASE）にてお受けしています。

【プロフィール（Elymph）】
- 元手術室看護師（20年）、看護師歴30年
- さとう式リンパケアインストラクター
- 終末期ケア専門士
- 看取り士
- ケアビューティスト
- 愛知県在住、オンライン全国対応

【お問い合わせ・SNS】
- LINE公式アカウント：準備中
- Instagram：@elymph8888（https://www.instagram.com/elymph8888/）
- note：note.com/mitreat（https://note.com/mitreat）

【返答のスタイル】
- 温かく、寄り添うような丁寧な口調で話してください。
- 簡潔にわかりやすくお答えください（長すぎる返答は避けてください）。
- 講座のお申し込みや詳細については、LINE公式アカウントまたはnoteへのお問い合わせを促してください。
- わからないことは正直に「詳細はお問い合わせください」とお伝えください。
- 絵文字は控えめに、1〜2個程度にとどめてください。`;

/* ---------- チャットAPIエンドポイント（SSEストリーミング） ---------- */
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // リクエストのバリデーション
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'メッセージが正しく送信されていません。' });
  }

  // SSEヘッダー設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    // Claude API ストリーミングリクエスト
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    // テキストチャンクをSSEで送信
    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    // ストリーム完了
    await stream.finalMessage();
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Claude APIエラー:', error);

    // エラーメッセージをクライアントに送信
    const errorMessage = error.status === 401
      ? 'APIキーが無効です。.envファイルを確認してください。'
      : 'AIとの接続に問題が発生しました。しばらくしてからお試しください。';

    res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
    res.end();
  }
});

/* ---------- ヘルスチェックエンドポイント ---------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Me Treat チャットボットサーバー稼働中' });
});

/* ---------- サーバー起動 ---------- */
app.listen(PORT, () => {
  console.log(`\n✨ Me Treat チャットボットサーバー起動`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   APIキー: ${process.env.ANTHROPIC_API_KEY ? '設定済み ✓' : '未設定 ✗ (.envファイルを確認してください)'}\n`);
});
