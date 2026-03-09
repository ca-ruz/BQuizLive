// client.js — shared utilities used by both host.html and index.html

/**
 * Show one screen, hide all others.
 * @param {string} id - The element id of the screen to show
 */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

/**
 * Format a number with thousands separator.
 */
function fmt(n) {
  return Number(n).toLocaleString();
}

/**
 * Escape HTML to prevent XSS when inserting user-supplied text.
 */
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

/**
 * Build a leaderboard HTML string from a sorted array.
 * @param {Array} leaderboard - [{ nickname, score }, ...]
 * @param {string} [highlightId] - playerId to highlight (player view)
 */
function buildLeaderboard(leaderboard, highlightId) {
  const medals = ["🥇", "🥈", "🥉"];
  return leaderboard
    .slice(0, 10)
    .map((entry, i) => {
      const isMe = entry.id === highlightId;
      const rank = medals[i] || `#${i + 1}`;
      return `
        <div class="lb-row${isMe ? ' style="background:rgba(247,147,26,.15);border-color:var(--accent)"' : ""}">
          <span class="lb-rank">${rank}</span>
          <span class="lb-name">${esc(entry.nickname)}${isMe ? " <em style='color:var(--accent);font-style:normal'>(tú)</em>" : ""}</span>
          <span class="lb-score">${fmt(entry.score)}</span>
        </div>`;
    })
    .join("");
}

/** Answer shape icons matching Kahoot-style layout */
const ANSWER_ICONS = ["▲", "◆", "●", "■"];
const ANSWER_LABELS = ["A", "B", "C", "D"];

/**
 * Start the visual countdown timer.
 * @param {number}   seconds   - Total seconds
 * @param {Function} onExpire  - Called when timer hits 0
 * @param {string}   barId     - Element id of the bar fill div
 * @param {string}   numId     - Element id of the numeric display
 * @returns {Function} - Cancel function
 */
function startCountdown(seconds, onExpire, barId, numId) {
  const bar = document.getElementById(barId);
  const num = document.getElementById(numId);
  const startTs = Date.now();
  let rafId;

  function tick() {
    const elapsed = (Date.now() - startTs) / 1000;
    const remaining = Math.max(0, seconds - elapsed);
    const pct = (remaining / seconds) * 100;

    if (bar) {
      bar.style.width = pct + "%";
      bar.classList.toggle("warning", remaining <= seconds * 0.5 && remaining > seconds * 0.25);
      bar.classList.toggle("danger",  remaining <= seconds * 0.25);
    }
    if (num) num.textContent = Math.ceil(remaining);

    if (remaining <= 0) {
      if (onExpire) onExpire();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}
