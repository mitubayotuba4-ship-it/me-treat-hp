/* ============================================
   Me Treat - AIチャットボット フロントエンド
   ============================================ */

/* ---------- 設定 ---------- */
const CHAT_CONFIG = {
  // バックエンドサーバーのURL（本番環境では変更してください）
  apiUrl: 'http://localhost:3000/api/chat',
  // ウェルカムメッセージ
  welcomeMessage: `こんにちは！Me Treatへようこそ。\nさとう式リンパケアや講座について、お気軽にご質問ください 🌿`,
};

/* ---------- 会話履歴 ---------- */
let conversationHistory = [];

/* ---------- DOM要素の取得 ---------- */
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

/* ---------- チャットウィンドウ開閉 ---------- */
let isOpen = false;
let hasShownWelcome = false;

chatToggleBtn.addEventListener('click', () => {
  isOpen = !isOpen;
  chatWindow.classList.toggle('chat--open', isOpen);
  chatToggleBtn.classList.toggle('chat-toggle--active', isOpen);

  // 初回オープン時にウェルカムメッセージを表示
  if (isOpen && !hasShownWelcome) {
    hasShownWelcome = true;
    setTimeout(() => {
      appendMessage('assistant', CHAT_CONFIG.welcomeMessage);
    }, 300);
  }

  // 開いたときに入力欄にフォーカス
  if (isOpen) {
    setTimeout(() => chatInput.focus(), 400);
  }
});

chatClose.addEventListener('click', () => {
  isOpen = false;
  chatWindow.classList.remove('chat--open');
  chatToggleBtn.classList.remove('chat-toggle--active');
});

/* ---------- メッセージ送信処理 ---------- */
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userText = chatInput.value.trim();
  if (!userText || chatSendBtn.disabled) return;

  // 入力欄をクリア・送信ボタンを無効化
  chatInput.value = '';
  chatInput.style.height = 'auto';
  setSending(true);

  // ユーザーメッセージを表示
  appendMessage('user', userText);

  // 会話履歴に追加
  conversationHistory.push({ role: 'user', content: userText });

  // AIの返答用バブルを作成（ストリーミング表示用）
  const assistantBubble = appendMessage('assistant', '', true);

  try {
    await streamChatResponse(assistantBubble);
  } catch (err) {
    assistantBubble.textContent = 'エラーが発生しました。しばらくしてからお試しください。';
    assistantBubble.classList.add('chat__msg-bubble--error');
  } finally {
    setSending(false);
    chatInput.focus();
  }
});

/* ---------- テキストエリア自動リサイズ ---------- */
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

// Shift+Enterで改行、Enterで送信
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

/* ---------- ストリーミングAPIリクエスト ---------- */
async function streamChatResponse(bubbleEl) {
  let fullText = '';

  const response = await fetch(CHAT_CONFIG.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: conversationHistory }),
  });

  if (!response.ok) {
    throw new Error(`サーバーエラー: ${response.status}`);
  }

  // SSEストリームを読み取り
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSEのイベントを行単位で処理
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 未完成の行はバッファに残す

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6);
      try {
        const event = JSON.parse(jsonStr);

        if (event.type === 'text') {
          // テキストチャンクを追記
          fullText += event.text;
          bubbleEl.textContent = fullText;
          scrollToBottom();

        } else if (event.type === 'error') {
          bubbleEl.textContent = event.message;
          bubbleEl.classList.add('chat__msg-bubble--error');
          return;

        } else if (event.type === 'done') {
          // 会話履歴にAIの返答を追加
          if (fullText) {
            conversationHistory.push({ role: 'assistant', content: fullText });
          }
          // タイピングインジケーターを削除
          bubbleEl.classList.remove('chat__msg-bubble--typing');
          return;
        }

      } catch {
        // JSONパースエラーは無視
      }
    }
  }
}

/* ---------- メッセージバブル追加 ---------- */
function appendMessage(role, text, isTyping = false) {
  const msgRow = document.createElement('div');
  msgRow.className = `chat__msg chat__msg--${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat__msg-bubble';

  if (isTyping) {
    // タイピング中インジケーター表示
    bubble.classList.add('chat__msg-bubble--typing');
    bubble.innerHTML = `<span class="chat__typing-dot"></span><span class="chat__typing-dot"></span><span class="chat__typing-dot"></span>`;
  } else {
    // テキストをHTMLエスケープして改行を<br>に変換
    bubble.innerHTML = escapeAndFormat(text);
  }

  msgRow.appendChild(bubble);
  chatMessages.appendChild(msgRow);
  scrollToBottom();

  return bubble;
}

/* ---------- テキストフォーマット（改行・リンク） ---------- */
function escapeAndFormat(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/* ---------- チャット欄を最下部にスクロール ---------- */
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ---------- 送信中の状態切り替え ---------- */
function setSending(sending) {
  chatSendBtn.disabled = sending;
  chatInput.disabled = sending;
  chatSendBtn.classList.toggle('chat__send-btn--loading', sending);
}
