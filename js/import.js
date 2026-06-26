// 取り込み学習モジュール
// ユーザーが貼り付けたセリフを学習カードに変換し、訳メモをブラウザに保存する。
// セリフ本文はユーザーが用意したものを扱う（アプリ側で著作物を複製・配布しない）。

const STORE_KEY = "movie-eng-mycards-v1";

// localStorage 読み書き ----------------------------------------------------
function loadCards() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveCards(cards) {
  localStorage.setItem(STORE_KEY, JSON.stringify(cards));
}

// 貼り付けテキストをカード配列に変換 --------------------------------------
// "話者: セリフ" 形式なら話者を分離。空行は無視。
function parseText(raw) {
  const cards = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    let speaker = "";
    let body = text;
    const m = text.match(/^([A-Z][A-Za-z .'’-]{0,30}?)\s*[:：]\s*(.+)$/);
    if (m) {
      speaker = m[1].trim();
      body = m[2].trim();
    }
    if (!body) continue;
    cards.push({
      id: cryptoId(),
      speaker,
      line: body,
      note: "" // ユーザーが書き込む訳・メモ
    });
  }
  return cards;
}

// 簡易ユニークID（時刻系APIが使えない環境向けにカウンタ＋既存数で生成）
let _seq = 0;
function cryptoId() {
  _seq += 1;
  return "c" + (loadCards().length + _seq) + "-" + (_seq * 2654435761 % 100000);
}

// 発音（ブラウザの音声合成）------------------------------------------------
function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("お使いのブラウザは音声読み上げに対応していません。");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// 単語を辞書リンク付きにする ------------------------------------------------
function linkify(text) {
  return text.replace(/[A-Za-z']+/g, (w) => {
    const clean = w.replace(/'/g, "%27");
    return `<a class="word" href="https://ejje.weblio.jp/content/${clean}" target="_blank" rel="noopener">${escapeHtmlI(w)}</a>`;
  });
}

// カード描画 ---------------------------------------------------------------
function renderMyCards() {
  const cards = loadCards();
  const container = document.getElementById("myCards");
  const empty = document.getElementById("importEmpty");
  const toolbar = document.getElementById("importToolbar");

  if (!cards.length) {
    container.innerHTML = "";
    empty.style.display = "block";
    toolbar.style.display = "none";
    return;
  }
  empty.style.display = "none";
  toolbar.style.display = "flex";
  document.getElementById("importCount").textContent = `${cards.length} 枚のカード`;

  container.innerHTML = cards.map((c) => `
    <article class="card mycard" data-id="${c.id}">
      <div class="mycard-head">
        ${c.speaker ? `<span class="character">${escapeHtmlI(c.speaker)}</span>` : ""}
        <button class="speak-btn" title="発音を聞く">🔊</button>
        <button class="del-btn" title="このカードを削除">✕</button>
      </div>
      <div class="line-en">${linkify(c.line)}</div>
      <div class="mynote-wrap">
        <div class="block-label">✍️ 自分の訳・メモ</div>
        <textarea class="mynote" placeholder="ここに日本語訳や気づいたことを書く…">${escapeHtmlI(c.note)}</textarea>
      </div>
    </article>
  `).join("");

  bindCardEvents();
}

function bindCardEvents() {
  const container = document.getElementById("myCards");

  container.querySelectorAll(".speak-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".mycard");
      const line = card.querySelector(".line-en").textContent;
      speak(line);
    });
  });

  container.querySelectorAll(".del-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".mycard").dataset.id;
      saveCards(loadCards().filter((c) => c.id !== id));
      renderMyCards();
    });
  });

  // メモ編集を自動保存
  container.querySelectorAll(".mynote").forEach((ta) => {
    ta.addEventListener("input", () => {
      const id = ta.closest(".mycard").dataset.id;
      const cards = loadCards();
      const target = cards.find((c) => c.id === id);
      if (target) {
        target.note = ta.value;
        saveCards(cards);
      }
    });
  });
}

// 操作ボタン ---------------------------------------------------------------
function setupImport() {
  document.getElementById("parseBtn").addEventListener("click", () => {
    const raw = document.getElementById("importText").value;
    const newCards = parseText(raw);
    if (!newCards.length) {
      alert("英語の行が見つかりませんでした。テキストを確認してください。");
      return;
    }
    const append = document.getElementById("appendMode").checked;
    const cards = append ? loadCards().concat(newCards) : newCards;
    saveCards(cards);
    document.getElementById("importText").value = "";
    renderMyCards();
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (confirm("取り込んだカードをすべて削除します。よろしいですか？")) {
      localStorage.removeItem(STORE_KEY);
      renderMyCards();
    }
  });

  document.getElementById("hideMyTranslation").addEventListener("change", (e) => {
    document.getElementById("myCards").classList.toggle("hide-mynote", e.target.checked);
  });

  renderMyCards();
}

function escapeHtmlI(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", setupImport);
