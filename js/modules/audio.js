/*
====================================================================
Module: audio.js
Purpose: Web Audio API synthetic chime.
  - Generates a clean dual-tone chime (C5 → E5) using oscillators.
  - Muted by default to respect browser autoplay policies.
  - AudioContext is lazily created on first user gesture.
====================================================================
*/

/**
 * Audio chime generator. Creates a two-tone sine-wave chime
 * with an ADSR-like envelope for a clean, pleasant sound.
 */
export class AudioChime {
  constructor() {
    this.ctx = null;
    this.muted = true; // Muted by default (autoplay policy)
  }

  /**
   * Lazily initialise and resume AudioContext.
   * Must be called from a user gesture handler.
   */
  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Play the two-tone chime (no-op if muted) */
  play() {
    if (this.muted) return;

    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // First tone — C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 523.25;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second tone — E5 (659.25 Hz), slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 659.25;
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  }

  /**
   * Toggle mute state.
   * @returns {boolean} New muted state (true = muted)
   */
  toggle() {
    this.muted = !this.muted;
    return this.muted;
  }
}
