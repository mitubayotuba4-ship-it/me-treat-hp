# Me Treat AIチャットボット セットアップ手順

## 必要なもの
- Node.js（v18以上）: https://nodejs.org/
- Anthropic APIキー: https://console.anthropic.com/

## セットアップ手順

### 1. 依存パッケージをインストール
```bash
cd C:\Users\user1\Desktop\my-hp
npm install
```

### 2. .envファイルを作成
`.env.example` をコピーして `.env` に名前を変え、APIキーを入力してください。

```bash
copy .env.example .env
```

`.env` の内容：
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
PORT=3000
```

### 3. サーバーを起動
```bash
node server.js
```

ブラウザで `http://localhost:3000` を開くと、チャットボット付きのページが表示されます。

## ファイル構成
```
my-hp/
├── server.js          ← Expressサーバー（Claude API代理）
├── package.json       ← Node.js依存パッケージ
├── .env               ← APIキー（Gitには含めない）
├── .env.example       ← .envのテンプレート
├── index.html         ← チャットウィジェット追加済み
├── css/style.css      ← チャットUIスタイル追加済み
└── js/chat.js         ← チャットフロントエンドロジック
```

## 注意事項
- `.env` ファイルは絶対にGitにコミットしないでください（APIキーが漏洩します）
- サーバー起動中のみチャットボットが動作します
