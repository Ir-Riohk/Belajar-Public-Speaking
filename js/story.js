/* story.js — fitur Story Builder (modul terpisah)
   3 kata acak -> buat cerita -> timer 90 detik -> simpan hasil + riwayat di LocalStorage.
   Memakai: Words (words.js) dan CountdownTimer (timer.js). Data hanya ditulis saat pengguna menekan "Simpan Hasil". */
const StoryBuilder = (function () {
  'use strict';

  const KEY = 'bicara.story.v1';
  const DURATION_MS = 90 * 1000;
  const WARN_MS = 15 * 1000;
  const MAX_ENTRIES = 100;
  const FALLBACK = [
    { word: 'Hujan', category: 'a' }, { word: 'Jembatan', category: 'b' }, { word: 'Rahasia', category: 'c' },
    { word: 'Pasar', category: 'd' }, { word: 'Mimpi', category: 'e' }, { word: 'Sepeda', category: 'f' }
  ];

  const $ = id => document.getElementById(id);
  let timer = null;
  let ready = false;
  let active = false;
  let words = [];
  let finished = false;
  let saved = false;

  /* ---------- Util ---------- */
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text; // selalu textContent, tidak pernah innerHTML
    return e;
  }
  function fmtClock(ms) {
    const s = Math.ceil(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '-' : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }
  function setStatus(msg, type) {
    const s = $('sb-status');
    s.textContent = msg;
    s.classList.toggle('sb-ok', type === 'ok');
    s.classList.toggle('sb-error', type === 'error');
  }

  /* ---------- LocalStorage (aman dari data kosong/rusak) ---------- */
  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(e => e && typeof e === 'object' && typeof e.id === 'string' &&
        Array.isArray(e.words) && e.words.length === 3 && e.words.every(w => typeof w === 'string'));
    } catch (err) { return []; }
  }
  function writeAll(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ENTRIES))); return true; }
    catch (err) { return false; }
  }
  function removeAll() {
    try { localStorage.removeItem(KEY); return true; } catch (err) { return false; }
  }

  /* ---------- Kata acak: 3 kata dari 3 kategori berbeda ---------- */
  function pickWords() {
    const pool = (typeof Words !== 'undefined' && Words && typeof Words.all === 'function') ? Words.all() : FALLBACK;
    const byCat = {};
    pool.forEach(x => { (byCat[x.category] = byCat[x.category] || []).push(x.word); });
    const cats = Object.keys(byCat);
    let result = [];
    for (let tries = 0; tries < 10; tries++) {
      const order = cats.slice();
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = order[i]; order[i] = order[j]; order[j] = t;
      }
      result = order.slice(0, 3).map(c => byCat[c][Math.floor(Math.random() * byCat[c].length)]);
      const same = result.length === words.length && result.every(w => words.includes(w));
      if (!same) break; // pastikan kombinasi berbeda dari sebelumnya
    }
    return result;
  }
  function renderWords() {
    const box = $('sb-words');
    box.replaceChildren();
    words.forEach((w, i) => {
      const li = el('li');
      li.appendChild(el('span', 'sb-word-label', 'Kata ' + (i + 1)));
      li.appendChild(el('span', 'sb-word-text', w));
      box.appendChild(li);
    });
  }

  /* ---------- Timer ---------- */
  function renderTimer(left) {
    const s = timer.state;
    const warn = (s === 'running' || s === 'paused') && left > 0 && left <= WARN_MS;
    $('sb-clock').textContent = fmtClock(left);
    $('sb-bar').style.width = ((1 - left / DURATION_MS) * 100) + '%';
    $('sb-clock').classList.toggle('sb-warn', warn);
    $('sb-bar').classList.toggle('sb-warn', warn);
    $('sb-start').disabled = s !== 'idle';
    $('sb-pause').disabled = s !== 'running' && s !== 'paused';
    $('sb-pause').textContent = s === 'paused' ? 'Lanjutkan' : 'Jeda';
    $('sb-reset').disabled = s === 'idle';
    $('sb-change').disabled = s === 'running' || s === 'paused';
  }
  function onFinish() {
    if (finished) return; // pengaman: hanya sekali
    finished = true;
    saved = false;
    renderTimer(0);
    $('sb-save').classList.remove('hidden');
    $('sb-save-btn').disabled = false;
    setStatus('Waktu habis! Simpan hasil latihanmu di bawah, atau tekan Reset untuk mengulang.', 'ok');
  }
  function resetRound() {
    timer.reset(); // menghentikan interval dan mengembalikan 01:30
    finished = false;
    saved = false;
    $('sb-save').classList.add('hidden');
    $('sb-reflection').value = '';
    $('sb-reflection').disabled = false;
    $('sb-save-btn').disabled = false;
    setStatus('', '');
  }

  /* ---------- Tombol ---------- */
  function onStart() {
    if (timer.state !== 'idle') return;
    setStatus('Cerita dimulai. Hubungkan ketiga katamu!', 'ok');
    timer.start();
  }
  function onPause() {
    if (timer.state === 'running') { timer.pause(); setStatus('Dijeda.', ''); }
    else if (timer.state === 'paused') { timer.resume(); setStatus('', ''); }
  }
  function onReset() {
    if (finished && !saved && !confirm('Hasil latihan belum disimpan. Reset dan buang hasil ini?')) return;
    resetRound();
  }
  function onChange() {
    if (timer.state === 'running' || timer.state === 'paused') return;
    if (finished && !saved && !confirm('Hasil latihan belum disimpan. Ganti kata dan buang hasil ini?')) return;
    words = pickWords();
    renderWords();
    resetRound();
  }

  /* ---------- Simpan & riwayat ---------- */
  function save() {
    if (!finished || saved) return; // tidak bisa menyimpan dua kali
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      words: words.slice(),
      seconds: Math.round(DURATION_MS / 1000),
      reflection: $('sb-reflection').value.trim().slice(0, 500)
    };
    const list = readAll();
    list.unshift(entry);
    if (!writeAll(list)) {
      setStatus('Penyimpanan tidak tersedia di browser ini, jadi hasil belum tersimpan. Periksa mode privat atau ruang penyimpanan.', 'error');
      return;
    }
    saved = true;
    $('sb-save-btn').disabled = true;
    $('sb-reflection').disabled = true;
    setStatus('Hasil latihan berhasil disimpan ke riwayat.', 'ok');
    renderHistory();
  }
  function removeOne(id) {
    if (!confirm('Hapus riwayat latihan ini?')) return;
    if (!writeAll(readAll().filter(e => e.id !== id))) {
      setStatus('Gagal menghapus: penyimpanan tidak tersedia.', 'error');
      return;
    }
    setStatus('Satu riwayat dihapus.', 'ok');
    renderHistory();
  }
  function clearAll() {
    if (!confirm('Hapus SEMUA riwayat Story Builder? Tindakan ini tidak bisa dibatalkan.')) return;
    if (!removeAll()) { setStatus('Gagal menghapus: penyimpanan tidak tersedia.', 'error'); return; }
    setStatus('Seluruh riwayat dihapus.', 'ok');
    renderHistory();
  }
  function renderHistory() {
    const list = readAll();
    const box = $('sb-history');
    box.replaceChildren();
    $('sb-clear-all').disabled = list.length === 0;
    if (list.length === 0) {
      box.appendChild(el('p', 'muted sb-empty', 'Belum ada riwayat. Selesaikan satu latihan, lalu simpan hasilnya di sini.'));
      return;
    }
    list.forEach((e, i) => {
      const reflection = typeof e.reflection === 'string' ? e.reflection : '';
      const detailId = 'sb-detail-' + i;
      const item = el('article', 'sb-entry');

      const top = el('div', 'sb-entry-top');
      top.appendChild(el('span', 'muted small', fmtDate(e.date)));
      const actions = el('div', 'sb-entry-actions');
      const viewBtn = el('button', 'btn sb-small', 'Lihat');
      viewBtn.type = 'button';
      viewBtn.setAttribute('aria-expanded', 'false');
      viewBtn.setAttribute('aria-controls', detailId);
      const delBtn = el('button', 'btn danger sb-small', 'Hapus');
      delBtn.type = 'button';
      delBtn.setAttribute('aria-label', 'Hapus riwayat: ' + e.words.join(', '));
      actions.appendChild(viewBtn);
      actions.appendChild(delBtn);
      top.appendChild(actions);

      const chips = el('div', 'sb-chips');
      e.words.forEach(w => chips.appendChild(el('span', 'chip', w)));

      const detail = el('div', 'sb-detail hidden');
      detail.id = detailId;
      detail.appendChild(el('p', null, 'Durasi: ' + (Number(e.seconds) || 90) + ' detik'));
      detail.appendChild(el('p', null, 'Catatan refleksi: ' + (reflection || 'tidak ada')));

      item.appendChild(top);
      item.appendChild(chips);
      if (reflection) item.appendChild(el('p', 'sb-preview', reflection.length > 90 ? reflection.slice(0, 90) + '…' : reflection));
      item.appendChild(detail);

      viewBtn.addEventListener('click', () => {
        const hide = !detail.classList.contains('hidden');
        detail.classList.toggle('hidden', hide);
        viewBtn.setAttribute('aria-expanded', String(!hide));
        viewBtn.textContent = hide ? 'Lihat' : 'Tutup';
      });
      delBtn.addEventListener('click', () => removeOne(e.id));
      box.appendChild(item);
    });
  }

  /* ---------- Dipanggil oleh app.js ---------- */
  function enter() {
    if (!ready) return;
    active = true;
    if (words.length !== 3) words = pickWords();
    renderWords();
    renderHistory();
  }
  function leave() {
    if (!ready) return;
    active = false;
    resetRound(); // timer dihentikan dan dibersihkan saat keluar dari fitur
  }
  function isBusy() {
    return ready && active && (timer.state === 'running' || timer.state === 'paused' || (finished && !saved));
  }

  function init() {
    if (ready || !$('view-story') || typeof CountdownTimer === 'undefined') return;
    timer = new CountdownTimer(DURATION_MS, { onTick: renderTimer, onFinish: onFinish });
    $('sb-start').addEventListener('click', onStart);
    $('sb-pause').addEventListener('click', onPause);
    $('sb-reset').addEventListener('click', onReset);
    $('sb-change').addEventListener('click', onChange);
    $('sb-clear-all').addEventListener('click', clearAll);
    $('sb-save').addEventListener('submit', function (ev) { ev.preventDefault(); save(); });
    ready = true;
    renderTimer(DURATION_MS);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { enter: enter, leave: leave, isBusy: isBusy };
})();