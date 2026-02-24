/* ═══════════════════════════════════════════════
   ✨ Particle Engine — Escape Room
   Supports: gold, fire, dust, stars, matrix, confetti
   ═══════════════════════════════════════════════ */

class ParticleEngine {
  constructor(canvasId, type = 'gold') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.type = type;
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.init();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    const count = this.type === 'matrix' ? 60 : (this.type === 'confetti' ? 150 : 80);
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(fromTop = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (this.type) {
      case 'gold':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: Math.random() * 0.8 + 0.2,
          opacity: Math.random() * 0.6 + 0.2,
          hue: 45 + Math.random() * 15
        };

      case 'fire':
        return {
          x: Math.random() * w,
          y: h + Math.random() * 20,
          size: Math.random() * 4 + 1,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: -(Math.random() * 2 + 1),
          opacity: Math.random() * 0.8 + 0.2,
          life: Math.random() * 100 + 50,
          maxLife: 150,
          hue: Math.random() * 40 + 10
        };

      case 'dust':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.3 + 0.1,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.02 + 0.01
        };

      case 'stars':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2.5 + 0.5,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.7 + 0.3,
          color: Math.random() > 0.3 ? '#fff' : (Math.random() > 0.5 ? '#aaf' : '#ffa')
        };

      case 'matrix':
        return {
          x: Math.random() * w,
          y: fromTop ? -20 : Math.random() * h,
          speed: Math.random() * 3 + 1,
          char: this.getHebrewChar(),
          size: Math.random() * 14 + 10,
          opacity: Math.random() * 0.5 + 0.1,
          changeRate: Math.random() * 0.02
        };

      case 'goldfall':
        return {
          x: Math.random() * w,
          y: fromTop ? -10 : Math.random() * h,
          size: Math.random() * 4 + 2,
          speedY: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.7 + 0.3,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 3
        };

      case 'confetti':
        return {
          x: Math.random() * w,
          y: fromTop ? -10 : Math.random() * h,
          size: Math.random() * 8 + 4,
          speedY: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 2,
          opacity: Math.random() * 0.8 + 0.2,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 8,
          color: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff4757', '#2ed573', '#5f27cd'][Math.floor(Math.random() * 8)],
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.1 + 0.05
        };

      default:
        return { x: Math.random() * w, y: Math.random() * h, size: 2, speedX: 0, speedY: 0.5, opacity: 0.3 };
    }
  }

  getHebrewChar() {
    const chars = 'אבגדהוזחטיכלמנסעפצקרשת';
    return chars[Math.floor(Math.random() * chars.length)];
  }

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.particles.forEach((p, i) => {
      switch (this.type) {
        case 'gold':
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.y > h) { p.y = -5; p.x = Math.random() * w; }
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          break;

        case 'fire':
          p.x += p.speedX;
          p.y += p.speedY;
          p.life--;
          p.opacity = (p.life / p.maxLife) * 0.8;
          p.size *= 0.995;
          if (p.life <= 0 || p.y < -10) {
            this.particles[i] = this.createParticle();
          }
          break;

        case 'dust':
          p.wobble += p.wobbleSpeed;
          p.x += p.speedX + Math.sin(p.wobble) * 0.3;
          p.y += p.speedY;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
          break;

        case 'stars':
          p.twinklePhase += p.twinkleSpeed;
          break;

        case 'matrix':
          p.y += p.speed;
          if (Math.random() < p.changeRate) p.char = this.getHebrewChar();
          if (p.y > h + 20) {
            this.particles[i] = this.createParticle(true);
          }
          break;

        case 'goldfall':
          p.y += p.speedY;
          p.x += p.speedX;
          p.rotation += p.rotSpeed;
          if (p.y > h + 10) {
            this.particles[i] = this.createParticle(true);
          }
          break;

        case 'confetti':
          p.wobble += p.wobbleSpeed;
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(p.wobble) * 0.5;
          p.rotation += p.rotSpeed;
          if (p.y > h + 10) {
            this.particles[i] = this.createParticle(true);
          }
          break;
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      this.ctx.save();

      switch (this.type) {
        case 'gold':
          this.ctx.globalAlpha = p.opacity;
          this.ctx.fillStyle = `hsl(${p.hue}, 80%, 60%)`;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = `hsl(${p.hue}, 80%, 60%)`;
          this.ctx.fill();
          break;

        case 'fire':
          this.ctx.globalAlpha = p.opacity;
          const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          grad.addColorStop(0, `hsl(${p.hue}, 100%, 70%)`);
          grad.addColorStop(1, 'transparent');
          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case 'dust':
          this.ctx.globalAlpha = p.opacity;
          this.ctx.fillStyle = '#c8b89a';
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case 'stars':
          const twinkle = Math.sin(p.twinklePhase) * 0.5 + 0.5;
          this.ctx.globalAlpha = p.opacity * twinkle;
          this.ctx.fillStyle = p.color;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = p.color;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case 'matrix':
          this.ctx.globalAlpha = p.opacity;
          this.ctx.fillStyle = '#00ff88';
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = '#00ff88';
          this.ctx.font = `${p.size}px monospace`;
          this.ctx.fillText(p.char, p.x, p.y);
          break;

        case 'goldfall':
          this.ctx.globalAlpha = p.opacity;
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(p.rotation * Math.PI / 180);
          this.ctx.fillStyle = '#ffd700';
          this.ctx.shadowBlur = 5;
          this.ctx.shadowColor = '#ffd700';
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;

        case 'confetti':
          this.ctx.globalAlpha = p.opacity;
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(p.rotation * Math.PI / 180);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          break;
      }

      this.ctx.restore();
    });
  }

  animate() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}
