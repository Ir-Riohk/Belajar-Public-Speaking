const Words = (function () {
  const BANK = {
    'Teknologi': ['Drone', 'Satelit', 'Algoritma', 'Internet', 'Kecerdasan Buatan', 'Robot', 'Privasi Digital', 'Media Sosial', 'Aplikasi', 'Enkripsi', 'Otomatisasi', 'Gawai'],
    'Pendidikan': ['Murid', 'Sekolah', 'Kurikulum', 'Literasi', 'Beasiswa', 'Disiplin', 'Rasa Ingin Tahu', 'Guru', 'Ujian', 'Kampus', 'Membaca', 'Kreativitas'],
    'Alam': ['Hutan', 'Sungai', 'Gempa', 'Iklim', 'Keanekaragaman Hayati', 'Laut', 'Gunung', 'Banjir', 'Energi Surya', 'Daur Ulang'],
    'Sosial': ['Gotong Royong', 'Toleransi', 'Tetangga', 'Kesetaraan', 'Solidaritas', 'Komunitas', 'Kepemimpinan', 'Relawan', 'Persahabatan', 'Etika'],
    'Psikologi': ['Motivasi', 'Stres', 'Empati', 'Kebiasaan', 'Kecemasan', 'Percaya Diri', 'Ingatan', 'Emosi', 'Fokus', 'Ketekunan'],
    'Ekonomi': ['Inflasi', 'Investasi', 'Pajak', 'UMKM', 'Utang', 'Tabungan', 'Pasar', 'Kemiskinan', 'Ekspor', 'Koperasi'],
    'Budaya': ['Batik', 'Wayang', 'Bahasa Daerah', 'Tradisi', 'Gamelan', 'Upacara Adat', 'Kuliner Nusantara', 'Mudik', 'Pantun', 'Warisan'],
    'Filsafat': ['Kebebasan', 'Kebenaran', 'Kebahagiaan', 'Makna Hidup', 'Waktu', 'Kematian', 'Kebijaksanaan', 'Moralitas', 'Takdir', 'Keberanian'],
    'Kehidupan Sehari-hari': ['Sarapan', 'Macet', 'Hujan', 'Belanja', 'Tidur', 'Transportasi Umum', 'Olahraga', 'Rumah', 'Uang Saku', 'Waktu Luang'],
    'Isu Masyarakat': ['Korupsi', 'Pengangguran', 'Hoaks', 'Sampah Plastik', 'Perundungan', 'Polusi Udara', 'Kesehatan Mental', 'Urbanisasi', 'Kesenjangan', 'Pernikahan Dini']
  };
 
  const ALL = [];
  Object.keys(BANK).forEach(cat => BANK[cat].forEach(word => ALL.push({ word: word, category: cat })));
 
  /* Pilih kata acak; hindari pengulangan sampai semua kata pernah muncul. */
  function next() {
    const valid = new Set(ALL.map(x => x.word));
    let used = BicaraStore.getUsed().filter(w => valid.has(w));
    let pool = ALL.filter(x => !used.includes(x.word));
    if (pool.length === 0) { used = []; pool = ALL.slice(); }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    used.push(pick.word);
    BicaraStore.setUsed(used);
    return pick;
  }
 
  return { next, total: ALL.length, all: function () { return ALL; } };
})();
 