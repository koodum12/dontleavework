'use client';

/**
 * 효과음/BGM. 오디오 파일 없이 WebAudio 로 짧은 단서음을 합성한다.
 * (음원 파일이 준비되면 playCue 만 교체하면 된다)
 */
export type Cue = 'step' | 'keyboard' | 'phone' | 'door' | 'tension' | 'ending';

const CUES: Record<Cue, { freq: number; duration: number; type: OscillatorType }> = {
  step: { freq: 120, duration: 0.06, type: 'triangle' },
  keyboard: { freq: 320, duration: 0.04, type: 'square' },
  phone: { freq: 880, duration: 0.18, type: 'sine' },
  door: { freq: 90, duration: 0.25, type: 'sawtooth' },
  tension: { freq: 55, duration: 0.9, type: 'sine' },
  ending: { freq: 220, duration: 1.2, type: 'sine' },
};

class AudioService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private _volume = 0.4;
  private _muted = false;

  get volume() { return this._volume; }
  get muted() { return this._muted; }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : this._volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setVolume(v: number) {
    this._volume = Math.min(Math.max(v, 0), 1);
    if (this.master) this.master.gain.value = this._muted ? 0 : this._volume;
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this._volume;
  }

  play(cue: Cue) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this._muted) return;
    const { freq, duration, type } = CUES[cue];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }
}

export const audio = new AudioService();
