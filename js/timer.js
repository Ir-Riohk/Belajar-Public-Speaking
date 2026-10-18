/* timer.js — timer hitung mundur berbasis timestamp (Date.now), mendukung jeda/lanjutkan */
class CountdownTimer {
  constructor(durationMs, handlers) {
    const h = handlers || {};
    this.duration = durationMs;
    this.onTick = h.onTick || function () {};
    this.onFinish = h.onFinish || function () {};
    this.state = 'idle'; // idle | running | paused | stopped | done
    this.remaining = durationMs;
    this.endAt = 0;
    this.handle = null;
  }
  start() {
    if (this.state === 'running') return;
    if (this.state === 'paused') return this.resume();
    this.remaining = this.duration;
    this._run();
  }
  resume() {
    if (this.state !== 'paused') return;
    this._run();
  }
  pause() {
    if (this.state !== 'running') return;
    this.remaining = Math.max(0, this.endAt - Date.now());
    this._clear();
    this.state = 'paused';
    this.onTick(this.remaining);
  }
  stop() { // akhiri lebih awal tanpa memicu onFinish
    if (this.state === 'running') this.remaining = Math.max(0, this.endAt - Date.now());
    this._clear();
    if (this.state !== 'idle') this.state = 'stopped';
    this.onTick(this.remaining);
  }
  reset() {
    this._clear();
    this.state = 'idle';
    this.remaining = this.duration;
    this.onTick(this.remaining);
  }
  elapsedMs() {
    const left = this.state === 'running' ? Math.max(0, this.endAt - Date.now()) : this.remaining;
    return this.duration - left;
  }
  _run() {
    this.endAt = Date.now() + this.remaining;
    this.state = 'running';
    this._clear();
    this.handle = setInterval(() => this._update(), 200);
    this._update();
  }
  _update() {
    if (this.state !== 'running') return;
    const left = Math.max(0, this.endAt - Date.now());
    this.remaining = left;
    this.onTick(left);
    if (left <= 0) {
      this._clear();
      this.state = 'done';
      this.onFinish();
    }
  }
  _clear() { if (this.handle) { clearInterval(this.handle); this.handle = null; } }
}