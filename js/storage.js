/* storage.js — penyimpanan LocalStorage yang aman dari data kosong/rusak */
const BicaraStore = (function () {
  const KEYS = { history: 'bicara.history.v1', stats: 'bicara.stats.v1', used: 'bicara.used.v1' };
  const MAX_HISTORY = 200;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function getHistory() {
    const h = read(KEYS.history, []);
    if (!Array.isArray(h)) return [];
    return h.filter(e => e && typeof e === 'object' && typeof e.word === 'string');
  }
  function getStats() {
    const s = read(KEYS.stats, null);
    const ok = s && Number.isFinite(s.count) && Number.isFinite(s.totalSeconds) && s.count >= 0 && s.totalSeconds >= 0;
    return ok ? { count: s.count, totalSeconds: s.totalSeconds } : { count: 0, totalSeconds: 0 };
  }
  function addEntry(entry) {
    const history = getHistory();
    history.unshift(entry);
    const stats = getStats();
    stats.count += 1;
    stats.totalSeconds += entry.speakSeconds || 0;
    const saved = write(KEYS.history, history.slice(0, MAX_HISTORY));
    return saved && write(KEYS.stats, stats);
  }
  function clearHistory() { try { localStorage.removeItem(KEYS.history); return true; } catch (e) { return false; } }
  function resetStats() { try { localStorage.removeItem(KEYS.stats); return true; } catch (e) { return false; } }
  function getUsed() { const u = read(KEYS.used, []); return Array.isArray(u) ? u.filter(x => typeof x === 'string') : []; }
  function setUsed(list) { return write(KEYS.used, list); }

  return { getHistory, getStats, addEntry, clearHistory, resetStats, getUsed, setUsed };
})();