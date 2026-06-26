// 映画で学ぶ英語 - コマンドー編
// セリフデータを読み込み、学習カードとして描画する

const DATA_URL = "data/dialogues.json";

async function init() {
  const loading = document.getElementById("loading");
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`データ取得失敗 (${res.status})`);
    const data = await res.json();
    renderBadge(data.meta);
    renderScenes(data.scenes);
    loading.style.display = "none";
  } catch (err) {
    loading.textContent = `読み込みに失敗しました: ${err.message}`;
  }

  // 練習モード切り替え
  document.getElementById("hideTranslation").addEventListener("change", (e) => {
    document.getElementById("sceneList").classList.toggle("hide-ja", e.target.checked);
  });

  setupTabs();
}

// タブ切り替え
function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.classList.toggle("active", p.id === `tab-${tab}`);
      });
    });
  });
}

function renderBadge(meta) {
  if (!meta) return;
  const badge = document.getElementById("movieBadge");
  badge.textContent = `${meta.movie} (${meta.year})`;
}

function renderScenes(scenes = []) {
  const list = document.getElementById("sceneList");
  list.innerHTML = scenes.map(buildCard).join("");

  // 各カードの開閉
  list.querySelectorAll(".card-head").forEach((head) => {
    head.addEventListener("click", () => {
      head.parentElement.classList.toggle("open");
    });
  });
}

function buildCard(scene) {
  const stars = "★".repeat(scene.difficulty || 1) + "☆".repeat(Math.max(0, 3 - (scene.difficulty || 1)));
  const vocab = (scene.vocab || []).map(buildVocab).join("");
  const usage = (scene.usage_notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  return `
    <article class="card">
      <div class="card-head">
        <div class="scene-meta">
          <span class="character">${escapeHtml(scene.character || "")}</span>
          <span class="scene-title">${escapeHtml(scene.title || "")}</span>
          <span class="diff">難易度 ${stars}</span>
        </div>
        <div class="line-en">"${escapeHtml(scene.line)}"</div>
        <div class="line-ja">${escapeHtml(scene.translation)}</div>
      </div>
      <div class="card-body">
        <div class="body-inner">
          ${scene.literal ? `<div><div class="block-label">直訳</div><div class="literal">${escapeHtml(scene.literal)}</div></div>` : ""}
          ${scene.context ? `<div><div class="block-label">シーン</div><div class="context">${escapeHtml(scene.context)}</div></div>` : ""}
          ${vocab ? `<div><div class="block-label">語彙</div>${vocab}</div>` : ""}
          ${usage ? `<div><div class="block-label">日常での使い方・注意点</div><ul class="usage-list">${usage}</ul></div>` : ""}
        </div>
      </div>
    </article>
  `;
}

function buildVocab(v) {
  return `
    <div class="vocab-item">
      <span class="vocab-word">${escapeHtml(v.word)}</span>
      <span class="vocab-pos">${escapeHtml(v.pos || "")}</span>
      <div class="vocab-mean">${escapeHtml(v.meaning || "")}</div>
      ${v.note ? `<div class="vocab-note">${escapeHtml(v.note)}</div>` : ""}
    </div>
  `;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", init);
