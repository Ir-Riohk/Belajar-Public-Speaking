/* app.js — navigasi halaman dan alur latihan */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const RESEARCH_MS = 10 * 60 * 1000;
  const SPEAK_MS = 60 * 1000;
  const MIN_RESEARCH_MS = 60 * 1000;
  const VIEWS = ['home', 'research', 'speak', 'eval', 'history'];
  const RATINGS = [
    { key: 'confidence', label: 'Tingkat Kepercayaan Diri' },
    { key: 'clarity', label: 'Penjelasan jelas kaga?' },
    { key: 'examples', label: 'Penggunaan contoh' },
    { key: 'fluency', label: 'Lancar Ora?' }
  ];
  let current = 'home';
  let session = null;
  let toastTimer = null;
  let spinHandle = null;

  /* ---------- Util ---------- */
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function fmtClock(ms) {
    const s = Math.ceil(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function fmtDuration(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m === 0 ? s + ' dtk' : m + ' mnt ' + s + ' dtk';
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '-' : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }
  function beep() {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      const ctx = new C();
      [0, 0.25, 0.5].forEach(t => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; g.gain.value = 0.15;
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.15);
      });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (e) { /* audio tidak tersedia */ }
  }


  /* Bunyi peringatan pendek tiap detik saat sisa 3, 2, 1 detik */
const warned = { r: null, s: null };
function shortBeep() {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = new C();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 1000; g.gain.value = 0.12;
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 400);
    if (navigator.vibrate) navigator.vibrate(80);
  } catch (e) { /* audio tidak tersedia */ }
}
function warnCountdown(key, left, state) {
  const sec = Math.ceil(left / 1000);
  if (sec > 3) { warned[key] = null; return; }
  if (state !== 'running' || sec < 1) return;
  if (warned[key] !== sec) { warned[key] = sec; shortBeep(); }
}

  /* ---------- Timer ---------- */
  const researchTimer = new CountdownTimer(RESEARCH_MS, {
    onTick: renderResearch,
    onFinish: function () { toast('Waktu riset habis. Saatnya berbicara!'); beep(); goSpeak(); }
  });
  const speakTimer = new CountdownTimer(SPEAK_MS, {
    onTick: renderSpeak,
    onFinish: function () { toast('Waktu udeh habis!'); beep(); finishSpeaking(); }
  });

  function renderResearch(left) {
    $('r-clock').textContent = fmtClock(left);
      warnCountdown('r', left, researchTimer.state);
    $('r-bar').style.width = ((1 - left / RESEARCH_MS) * 100) + '%';
    const s = researchTimer.state;
    const sp = isSpinning();
    $('r-start').disabled = s !== 'idle' || sp;
    $('r-pause').disabled = s !== 'running';
    $('r-resume').disabled = s !== 'paused';
    $('r-reset').disabled = s === 'idle';
    $('btn-shuffle').disabled = s !== 'idle' || sp;
    $('btn-ready').disabled = sp;
  }
  function renderSpeak(left) {
    $('s-clock').textContent = fmtClock(left);
      warnCountdown('s', left, speakTimer.state);
    $('s-bar').style.width = ((1 - left / SPEAK_MS) * 100) + '%';
    const s = speakTimer.state;
    $('view-speak').classList.toggle('warn', s !== 'idle' && left > 0 && left <= 15000);
    $('s-start').disabled = s !== 'idle';
    $('s-pause').disabled = s !== 'running' && s !== 'paused';
    $('s-pause').textContent = s === 'paused' ? 'Lanjutkan' : 'Jeda';
    $('s-end').disabled = s !== 'running' && s !== 'paused';
    const sec = (SPEAK_MS - left) / 1000;
    const phase = sec < 10 ? 0 : sec < 25 ? 1 : sec < 45 ? 2 : 3;
    document.querySelectorAll('#phases li').forEach((li, i) =>
      li.classList.toggle('active', s !== 'idle' && s !== 'done' && s !== 'stopped' && i === phase));
  }

  /* ---------- Navigasi ---------- */
  function show(name) {
    current = name;
    VIEWS.forEach(v => $('view-' + v).classList.toggle('hidden', v !== name));
    window.scrollTo(0, 0);
    if (name === 'home') renderHome();
    if (name === 'history') renderHistory();
  }
  function endSession() {
    $('tease-box').classList.add('hidden');
    researchTimer.reset();
    speakTimer.reset();
    session = null;
  }
  function go(name) {
    const inSession = session && (current === 'research' || current === 'speak' || current === 'eval');
    if (inSession && name !== current) {
      if (!confirm('Sesi latihan akan dihentikan dan evaluasi belum tersimpan. Keluar sekarang?')) return;
      endSession();
    }
    show(name);
  }

  /* ---------- Alur latihan ---------- */
  function renderWord() {
    document.querySelectorAll('.js-word').forEach(n => n.textContent = session.word);
    document.querySelectorAll('.js-category').forEach(n => n.textContent = session.category);
  }
   function isSpinning() { return !!(session && session.spinning); }

function spinWord() {
  clearTimeout(spinHandle);
  const pool = Words.all();
  const reel = $('reel');
  const strip = $('reel-strip');
  const title = document.querySelector('#view-research .js-word');
  const chips = document.querySelectorAll('#view-research .js-category');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = reduce ? 1 : 32;

  session.spinning = true;
  strip.replaceChildren();
  for (let k = 0; k < count - 1; k++) {
    strip.appendChild(el('div', 'reel-item', pool[Math.floor(Math.random() * pool.length)].word));
  }
  strip.appendChild(el('div', 'reel-item', session.word));

  title.classList.add('hidden');
  reel.classList.remove('hidden');
  chips.forEach(n => { n.textContent = 'Mengacak kata...'; });
  strip.style.transition = 'none';
  strip.style.transform = 'translateY(0)';
  void strip.offsetHeight;
  const itemH = strip.firstChild.getBoundingClientRect().height;
  strip.style.transition = reduce ? 'none' : 'transform 2.8s cubic-bezier(.12,.7,.1,1)';
  strip.style.transform = 'translateY(-' + ((count - 1) * itemH) + 'px)';
  renderResearch(researchTimer.remaining);

  spinHandle = setTimeout(function () {
    if (!session) return;
    session.spinning = false;
    reel.classList.add('hidden');
    title.classList.remove('hidden');
    renderWord();
    title.classList.add('landed');
    setTimeout(() => title.classList.remove('landed'), 800);
    renderResearch(researchTimer.remaining);
  }, reduce ? 50 : 2900);
}
  function startPractice() {
    endSession();
    clearTimeout(spinHandle);
    const w = Words.next();
    session = { word: w.word, category: w.category, notes: '', speakSeconds: 0 };
    $('r-notes').value = '';
    show('research');
    spinWord();
   
  }
  function shuffleWord() {
    if (!session || session.spinning || researchTimer.state !== 'idle') return;
    const w = Words.next();
    session.word = w.word;
    session.category = w.category;
    spinWord();
  }
  function showTease(visible) {
  const box = $('tease-box');
  box.classList.toggle('hidden', !visible);
  if (visible) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function onReadyClick() {
  if (!session || session.spinning) return;
  if (researchTimer.elapsedMs() < MIN_RESEARCH_MS) { showTease(true); return; }
  goSpeak();
}
  function goSpeak() {
    if (!session || session.spinning) return;  
    showTease(false);
    session.notes = $('r-notes').value.trim();
    researchTimer.reset();
    speakTimer.reset();
    $('s-notes').textContent = session.notes || '(Tidak ada catatan)';
    show('speak');
  }
  function finishSpeaking() {
    if (!session) return;
    session.speakSeconds = Math.max(1, Math.round(speakTimer.elapsedMs() / 1000));
    $('e-duration').textContent = fmtDuration(session.speakSeconds);
    resetEvalForm();
    show('eval');
  }
  function endSpeakingEarly() {
    if (speakTimer.state !== 'running' && speakTimer.state !== 'paused') return;
    speakTimer.stop();
    finishSpeaking();
  }

  /* ---------- Evaluasi ---------- */
  function buildRatings() {
    const box = $('ratings');
    RATINGS.forEach(r => {
      const wrap = el('div', 'rating');
      wrap.appendChild(el('p', null, r.label));
      const pills = el('div', 'pills');
      for (let i = 1; i <= 5; i++) {
        const label = el('label', 'pill');
        const input = document.createElement('input');
        input.type = 'radio'; input.name = r.key; input.value = String(i);
        label.append(input, el('span', null, String(i)));
        pills.appendChild(label);
      }
      wrap.appendChild(pills);
      box.appendChild(wrap);
    });
  }
  function resetEvalForm() {
    $('eval-form').reset();
    $('e-error').classList.add('hidden');
  }
  function submitEval(ev) {
    ev.preventDefault();
    if (!session) return;
    const values = {};
    const missing = [];
    RATINGS.forEach(r => {
      const chosen = document.querySelector('input[name="' + r.key + '"]:checked');
      if (chosen) values[r.key] = Number(chosen.value); else missing.push(r.label);
    });
    const err = $('e-error');
    if (missing.length) {
      err.textContent = 'Mohon isi penilaian: ' + missing.join(', ') + '.';
      err.classList.remove('hidden');
      return;
    }
    err.classList.add('hidden');
    const entry = Object.assign({
      id: Date.now().toString(36),
      word: session.word,
      category: session.category,
      date: new Date().toISOString(),
      speakSeconds: session.speakSeconds,
      notes: $('e-notes').value.trim().slice(0, 500)
    }, values);
    if (!BicaraStore.addEntry(entry)) {
      toast('Gagal menyimpan: penyimpanan browser penuh atau dinonaktifkan.');
      return;
    }
    session = null;
    toast('Evaluasi tersimpan. Kerja bagus!');
    show('history');
  }

  /* ---------- Tampilan data ---------- */
  function renderEntries(container, entries, emptyText) {
    container.replaceChildren();
    if (!entries.length) { container.appendChild(el('p', 'muted', emptyText)); return; }
    entries.forEach(e => {
      const card = el('article', 'entry');
      const top = el('div', 'entry-top');
      top.append(el('h3', null, e.word), el('span', 'chip', e.category || '-'));
      const meta = el('p', 'muted small', fmtDate(e.date) + ' · Berbicara ' + fmtDuration(Number(e.speakSeconds) || 0));
      const n = v => (Number.isFinite(v) ? v : '-');
      const scores = el('p', 'scores', 'Percaya diri ' + n(e.confidence) + '/5 · Kejelasan ' + n(e.clarity) +
        '/5 · Contoh ' + n(e.examples) + '/5 · Kelancaran ' + n(e.fluency) + '/5');
      card.append(top, meta, scores);
      if (e.notes) card.appendChild(el('p', 'note', 'Catatan: ' + e.notes));
      container.appendChild(card);
    });
  }
  function renderHome() {
    const stats = BicaraStore.getStats();
    $('stat-count').textContent = stats.count;
    $('stat-time').textContent = fmtDuration(stats.totalSeconds);
    renderEntries($('recent-list'), BicaraStore.getHistory().slice(0, 3), 'Belum ada latihan. Ayo mulai latihan pertamamu!');
  }
  function renderHistory() {
    renderEntries($('history-list'), BicaraStore.getHistory(), 'Riwayat masih kosong.');
  }

  /* ---------- Event ---------- */
  function init() {
    buildRatings();
    $('btn-brand').addEventListener('click', () => go('home'));
    $('nav-home').addEventListener('click', () => go('home'));
    $('nav-history').addEventListener('click', () => go('history'));
    $('btn-all-history').addEventListener('click', () => go('history'));
    $('btn-start').addEventListener('click', startPractice);
    $('btn-shuffle').addEventListener('click', shuffleWord);
    $('r-start').addEventListener('click', () => { researchTimer.start(); });
    $('r-pause').addEventListener('click', () => researchTimer.pause());
    $('r-resume').addEventListener('click', () => researchTimer.resume());
    $('r-reset').addEventListener('click', () => researchTimer.reset());
    $('btn-ready').addEventListener('click', onReadyClick);
    $('btn-tease').addEventListener('click', goSpeak);
    $('btn-back-research').addEventListener('click', () => showTease(false));
    $('s-start').addEventListener('click', () => speakTimer.start());
    $('s-pause').addEventListener('click', () => {
      if (speakTimer.state === 'running') speakTimer.pause(); else speakTimer.resume();
    });
    $('s-end').addEventListener('click', endSpeakingEarly);
    $('eval-form').addEventListener('submit', submitEval);
    $('btn-clear-history').addEventListener('click', () => {
      if (confirm('Hapus seluruh riwayat latihan? Tindakan ini tidak bisa dibatalkan.')) {
        BicaraStore.clearHistory(); renderHistory(); renderHome(); toast('Riwayat dihapus.');
      }
    });
    $('btn-reset-stats').addEventListener('click', () => {
      if (confirm('Reset statistik (jumlah latihan dan total waktu berbicara)?')) {
        BicaraStore.resetStats(); renderHome(); toast('Statistik direset.');
      }
    });
    window.addEventListener('beforeunload', e => {
      if (session) { e.preventDefault(); e.returnValue = ''; }
    });
    researchTimer.reset();
    speakTimer.reset();
    show('home');
  }
  document.addEventListener('DOMContentLoaded', init);
})();
