/* ═══════════════════════════════════════════════
   🎮 Game Engine — Exodus Escape Room
   Timer, SHA-256 passwords, hints, transitions
   ═══════════════════════════════════════════════ */

const GAME = {
  TOTAL_TIME: 30 * 60, // 30 minutes
  STORAGE_PREFIX: 'exodus_', // separate from other escape rooms
  ROOMS: ['index.html', 'room1.html', 'room2.html', 'room3.html', 'room4.html', 'victory.html'],
  HASHES: {
    'index':  'b24b283344eaac737f4e392cbbdeedb5df5c54c156b6411013d6b6b3523fc67d', // חורב
    'room1':  'fed88b40aba63cac05eadd5db0088c036005ec235c7be6fd87d656946b733332', // 430
    'room2':  '284b7e6d788f363f910f7beb1910473e23ce9d6c871f1ce0f31f22a982d48ad4', // 600
    'room3':  'd59eced1ded07f84c145592f65bdf854358e009c5cd705f5215bf18697fed103', // 40
    'room4':  'ad57366865126e55649ecb23ae1d48887544976efea46a48eb5d85a6eeb4d306'  // 100
  }
};

/* ── SHA-256 Hash ── */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Timer ── */
class GameTimer {
  constructor() {
    this.display = document.querySelector('.timer-display');
    this.interval = null;
    this.init();
  }

  init() {
    if (!localStorage.getItem(GAME.STORAGE_PREFIX + 'StartTime')) {
      localStorage.setItem(GAME.STORAGE_PREFIX + 'StartTime', Date.now().toString());
      localStorage.setItem(GAME.STORAGE_PREFIX + 'Errors', '0');
    }
    this.tick();
    this.interval = setInterval(() => this.tick(), 1000);
  }

  getElapsed() {
    const start = parseInt(localStorage.getItem(GAME.STORAGE_PREFIX + 'StartTime') || Date.now());
    return Math.floor((Date.now() - start) / 1000);
  }

  getRemaining() {
    return Math.max(0, GAME.TOTAL_TIME - this.getElapsed());
  }

  tick() {
    const remaining = this.getRemaining();
    if (remaining <= 0) { this.timeUp(); return; }
    const min = Math.floor(remaining / 60).toString().padStart(2, '0');
    const sec = (remaining % 60).toString().padStart(2, '0');
    if (this.display) {
      this.display.textContent = `${min}:${sec}`;
      if (remaining < 300) this.display.classList.add('warning');
    }
  }

  timeUp() {
    clearInterval(this.interval);
    if (this.display) this.display.textContent = '00:00';
    document.body.innerHTML = `
      <div class="fog-overlay"></div>
      <canvas id="particles-canvas"></canvas>
      <div class="room-container failed-container">
        <div class="failed-icon">⏰</div>
        <h1 class="failed-title">נגמר הזמן!</h1>
        <p style="margin: 20px 0; color: rgba(255,255,255,0.6); font-size: 1.1rem;">
          שערי מצרים ננעלו. 30 דקות חלפו — ולא הספקת לצאת.<br>
          אבל גם משה נכשל בהתחלה. נסה שוב.
        </p>
        <a href="index.html" class="restart-btn" onclick="GameTimer.reset()">🔄 נסה שוב מההתחלה</a>
      </div>
    `;
  }

  static reset() {
    localStorage.removeItem(GAME.STORAGE_PREFIX + 'StartTime');
    localStorage.removeItem(GAME.STORAGE_PREFIX + 'Errors');
    localStorage.removeItem(GAME.STORAGE_PREFIX + 'CurrentRoom');
  }

  static getTotalTime() {
    const start = parseInt(localStorage.getItem(GAME.STORAGE_PREFIX + 'StartTime') || Date.now());
    return Math.floor((Date.now() - start) / 1000);
  }

  static formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
}

/* ── Password Checker ── */
class PasswordChecker {
  constructor(roomId, nextPage) {
    this.roomId = roomId;
    this.nextPage = nextPage;
    this.attempts = 0;
    this.hash = GAME.HASHES[roomId];
    this.input = document.querySelector('.password-input');
    this.btn = document.querySelector('.submit-btn');
    this.attemptsDisplay = document.querySelector('.attempts-display');
    this.hintBox = document.querySelector('.hint-box');
    this.strongHintBox = document.querySelector('.hint-box.strong');
    this.successOverlay = document.querySelector('.success-overlay');

    if (this.btn) this.btn.addEventListener('click', () => this.check());
    if (this.input) {
      this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.check(); });
    }
  }

  async check() {
    if (!this.input) return;
    const value = this.input.value.trim();
    if (!value) return;
    const hashed = await sha256(value);
    if (hashed === this.hash) this.onSuccess(); else this.onError();
  }

  onSuccess() {
    this.input.classList.add('success');
    this.input.disabled = true;
    this.btn.disabled = true;
    const roomIndex = GAME.ROOMS.indexOf(this.nextPage);
    localStorage.setItem(GAME.STORAGE_PREFIX + 'CurrentRoom', roomIndex.toString());
    setTimeout(() => {
      if (this.successOverlay) this.successOverlay.classList.add('active');
    }, 500);
  }

  onError() {
    this.attempts++;
    const errors = parseInt(localStorage.getItem(GAME.STORAGE_PREFIX + 'Errors') || '0') + 1;
    localStorage.setItem(GAME.STORAGE_PREFIX + 'Errors', errors.toString());

    this.input.classList.add('error');
    document.body.classList.add('screen-shake');
    const flash = document.querySelector('.red-flash');
    if (flash) { flash.classList.remove('active'); void flash.offsetWidth; flash.classList.add('active'); }

    setTimeout(() => {
      this.input.classList.remove('error');
      document.body.classList.remove('screen-shake');
      this.input.value = '';
      this.input.focus();
    }, 500);

    if (this.attemptsDisplay) this.attemptsDisplay.textContent = `ניסיונות: ${this.attempts}`;
    if (this.attempts >= 3 && this.hintBox) this.hintBox.classList.add('visible');
    if (this.attempts >= 5 && this.strongHintBox) this.strongHintBox.classList.add('visible');
  }
}

/* ── Lightning Effect ── */
function startLightning(minInterval = 5000, maxInterval = 15000) {
  const flash = document.querySelector('.flash-overlay');
  if (!flash) return;
  function doFlash() {
    flash.classList.remove('active'); void flash.offsetWidth; flash.classList.add('active');
    setTimeout(doFlash, Math.random() * (maxInterval - minInterval) + minInterval);
  }
  setTimeout(doFlash, Math.random() * maxInterval);
}

/* ── Room Navigation Guard ── */
function checkRoomAccess(requiredRoom) {
  const current = parseInt(localStorage.getItem(GAME.STORAGE_PREFIX + 'CurrentRoom') || '0');
  if (current < requiredRoom) {
    window.location.href = GAME.ROOMS[current];
    return false;
  }
  return true;
}

/* ── Victory Stats ── */
function getStats() {
  return {
    totalTime: GameTimer.getTotalTime(),
    formattedTime: GameTimer.formatTime(GameTimer.getTotalTime()),
    errors: parseInt(localStorage.getItem(GAME.STORAGE_PREFIX + 'Errors') || '0'),
    score: Math.max(0, 1000 - (parseInt(localStorage.getItem(GAME.STORAGE_PREFIX + 'Errors') || '0') * 50) - Math.floor(GameTimer.getTotalTime() / 6))
  };
}

/* ── Share ── */
function shareWhatsApp() {
  const stats = getStats();
  const text = `🏛️ יצאתי ממצרים! חדר בריחה דיגיטלי — יציאת מצרים%0A⏱️ זמן: ${stats.formattedTime}%0A🏆 ניקוד: ${stats.score}%0A❌ שגיאות: ${stats.errors}%0A%0A🔥 מספיק אמיץ?`;
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyLink() {
  const url = window.location.href.replace(/victory\.html.*/, 'index.html');
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.copy-link');
    if (btn) { btn.textContent = '✅ הועתק!'; setTimeout(() => { btn.innerHTML = '🔗 העתק לינק'; }, 2000); }
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.querySelector('.password-input');
  if (pwInput) setTimeout(() => pwInput.focus(), 500);
});
