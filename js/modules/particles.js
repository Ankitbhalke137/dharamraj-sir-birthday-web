/*
====================================================================
Module: particles.js
Purpose: Canvas-based particle explosion system.
  - Renders bursts of coloured particles on demand.
  - Uses requestAnimationFrame for smooth 60 FPS.
  - Automatically resizes canvas with ResizeObserver.
  - Dracula colour palette for particles.
====================================================================
*/

/**
 * Canvas particle engine. Creates fixed-position canvas overlay
 * and manages a particle array with physics (gravity, friction, fade).
 */
export class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;

    this.palette = [
      '#ff79c6', '#bd93f9', '#50fa7b', '#ffb86c',
      '#8be9fd', '#f1fa8c', '#ff5555', '#f8f8f2',
    ];

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    this.initCanvas();
    this.setupResizeListener();
  }

  initCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupResizeListener() {
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => this.resize());
      observer.observe(document.documentElement);
    } else {
      window.addEventListener('resize', this.resize);
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Emit a burst of particles from (x, y).
   * @param {number} x     Centre X coordinate
   * @param {number} y     Centre Y coordinate
   * @param {number} count Number of particles (default 80)
   */
  burst(x, y, count = 80) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2 + Math.random() * 4,
        color: this.palette[Math.floor(Math.random() * this.palette.length)],
        life: 1.0,
        decay: 0.008 + Math.random() * 0.012,
        gravity: 0.08,
        friction: 0.99,
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.animationId = requestAnimationFrame(this.animate);
    }
  }

  /** Main render loop — runs at display refresh rate */
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const alive = [];
    for (const p of this.particles) {
      p.vx *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) continue;

      alive.push(p);

      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
    this.particles = alive;

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.isRunning = false;
      this.animationId = null;
    }
  }

  /** Clean up animation and resize listeners */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isRunning = false;
    this.particles = [];
    window.removeEventListener('resize', this.resize);
  }
}
