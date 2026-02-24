/* ═══════════════════════════════════════════════
   🎮 Game Engine — Bible Escape Room
   Timer, SHA-256 passwords, hints, transitions
   ═══════════════════════════════════════════════ */

const GAME = {
  TOTAL_TIME: 30 * 60, // 30 minutes in seconds
  ROOMS: ['index.html', 'room1.html', 'room2.html', 'room3.html', 'room4.html', 'victory.html'],
  HASHES: {
    'index':  '7cefbabe5b85eeed081c02b79246437caebde64c0f15f13f76574b615523c008', // תאנה
    'room1':  'bdc5d8a48c23897906b09a9a3680bd2e9c8b3121edbda36f949800f0959c8d55', // 900
    'room2':  '5f9c4ab08cac7457e9111a30e4664920607ea2c115a1433d7be98e97e64244ca', // 26
    'room3':  '7eb2534933da28acb912f29c8c4cf93fbd9d962a8fefbc7ce36a658c43cc62fc', // עשיו
    'room4':  '9556b82499cc0aaf86aee7f0d253e17c61b7ef73d48a295f37d98f08b04ffa7f'  // 255
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
    // Start timer on first room entry
    if (!localStorage.getItem('escapeStartTime')) {
      localStorage.setItem('escapeStartTime', Date.now().toString());
      localStorage.setItem('escapeErrors', '0');
    }
    this.tick();
    this.interval = setInterval(() => this.tick(), 1000);
  }

  getElapsed() {
    const start = parseInt(localStorage.getItem('escapeStartTime') || Date.now());
    return Math.floor((Date.now() - start) / 1000);
  }

  getRemaining() {
    return Math.max(0, GAME.TOTAL_TIME - this.getElapsed());
  }

  tick() {
    const remaining = this.getRemaining();
    if (remaining <= 0) {
      this.timeUp();
      return;
    }
    const min = Math.floor(remaining / 60).toString().padStart(2, '0');
    const sec = (remaining % 60).toString().padStart(2, '0');
    if (this.display) {
      this.display.textContent = `${min}:${sec}`;
      if (remaining < 300) {
        this.display.classList.add('warning');
      }
    }
  }

  timeUp() {
    clearInterval(this.interval);
    if (this.display) this.display.textContent = '00:00';
    // Show failed screen
    document.body.innerHTML = `
      <div class="fog-overlay"></div>
      <canvas id="particles-canvas"></canvas>
      <div class="room-container failed-container">
        <div class="failed-icon">⏰</div>
        <h1 class="failed-title">נגמר הזמן!</h1>
        <p style="margin: 20px 0; color: rgba(255,255,255,0.6); font-size: 1.1rem;">
          השערים ננעלו. 30 דקות עברו — ולא הספקת.<br>
          אבל גיבור אמיתי לא מוותר.
        </p>
        <a href="index.html" class="restart-btn" onclick="GameTimer.reset()">🔄 נסה שוב — הפעם תצליח</a>
      </div>
    `;
  }

  static reset() {
    localStorage.removeItem('escapeStartTime');
    localStorage.removeItem('escapeErrors');
    localStorage.removeItem('escapeCurrentRoom');
  }

  static getTotalTime() {
    const start = parseInt(localStorage.getItem('escapeStartTime') || Date.now());
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
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.check();
      });
    }
  }

  async check() {
    if (!this.input) return;
    const value = this.input.value.trim();
    if (!value) return;

    const hashed = await sha256(value);

    if (hashed === this.hash) {
      this.onSuccess();
    } else {
      this.onError();
    }
  }

  onSuccess() {
    // Visual feedback
    this.input.classList.add('success');
    this.input.disabled = true;
    this.btn.disabled = true;

    // Save progress
    const roomIndex = GAME.ROOMS.indexOf(this.nextPage);
    localStorage.setItem('escapeCurrentRoom', roomIndex.toString());

    // Show success overlay
    setTimeout(() => {
      if (this.successOverlay) {
        this.successOverlay.classList.add('active');
      }
    }, 500);
  }

  onError() {
    this.attempts++;
    const errors = parseInt(localStorage.getItem('escapeErrors') || '0') + 1;
    localStorage.setItem('escapeErrors', errors.toString());

    // Visual feedback
    this.input.classList.add('error');
    document.body.classList.add('screen-shake');

    // Red flash
    const flash = document.querySelector('.red-flash');
    if (flash) {
      flash.classList.remove('active');
      void flash.offsetWidth;
      flash.classList.add('active');
    }

    setTimeout(() => {
      this.input.classList.remove('error');
      document.body.classList.remove('screen-shake');
      this.input.value = '';
      this.input.focus();
    }, 500);

    // Update attempts display
    if (this.attemptsDisplay) {
      this.attemptsDisplay.textContent = `ניסיונות: ${this.attempts}`;
    }

    // Show hints
    if (this.attempts >= 3 && this.hintBox) {
      this.hintBox.classList.add('visible');
    }
    if (this.attempts >= 5 && this.strongHintBox) {
      this.strongHintBox.classList.add('visible');
    }
  }
}

/* ── Lightning Effect ── */
function startLightning(minInterval = 5000, maxInterval = 15000) {
  const flash = document.querySelector('.flash-overlay');
  if (!flash) return;

  function doFlash() {
    flash.classList.remove('active');
    void flash.offsetWidth;
    flash.classList.add('active');
    const next = Math.random() * (maxInterval - minInterval) + minInterval;
    setTimeout(doFlash, next);
  }

  setTimeout(doFlash, Math.random() * maxInterval);
}

/* ── Atbash Cipher ── */
function atbashEncode(text) {
  const aleph = 'אבגדהוזחטיכלמנסעפצקרשת';
  const tav = 'תשרקצפעסנמלכיטחזוהדגבא';
  return text.split('').map(c => {
    const idx = aleph.indexOf(c);
    return idx >= 0 ? tav[idx] : c;
  }).join('');
}

function atbashDecode(text) {
  return atbashEncode(text); // Atbash is its own inverse
}

/* ── Room Navigation Guard ── */
function checkRoomAccess(requiredRoom) {
  const current = parseInt(localStorage.getItem('escapeCurrentRoom') || '0');
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
    errors: parseInt(localStorage.getItem('escapeErrors') || '0'),
    score: Math.max(0, 1000 - (parseInt(localStorage.getItem('escapeErrors') || '0') * 50) - Math.floor(GameTimer.getTotalTime() / 6))
  };
}

/* ── Share ── */
function shareWhatsApp() {
  const stats = getStats();
  const text = `🏰 עברתי את חדר הבריחה של התנ"ך!%0A⏱️ זמן: ${stats.formattedTime}%0A🏆 ניקוד: ${stats.score}%0A❌ שגיאות: ${stats.errors}%0A%0A🔥 אתה מעז להיכנס?`;
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyLink() {
  const url = window.location.href.replace(/victory\.html.*/, 'index.html');
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.copy-link');
    if (btn) {
      btn.textContent = '✅ הועתק!';
      setTimeout(() => { btn.innerHTML = '🔗 העתקה לינק'; }, 2000);
    }
  });
}

/* ── Init on DOM Ready ── */
document.addEventListener('DOMContentLoaded', () => {
  // Focus password input
  const pwInput = document.querySelector('.password-input');
  if (pwInput) setTimeout(() => pwInput.focus(), 500);
});
