# BICARA — Latihan Public Speaking

**Satu kata. Sepuluh menit persiapan. Satu menit untuk meyakinkan.**

Website latihan public speaking Bahasa Indonesia dengan tantangan kata acak.
Dibuat dengan HTML5, CSS3, dan JavaScript murni. Riwayat disimpan di LocalStorage.
Tanpa framework, tanpa build, tanpa API key.

## Struktur Folder

```
bicara/
├── index.html
├── css/style.css
├── js/
│   ├── app.js       (navigasi dan alur latihan)
│   ├── timer.js     (timer berbasis timestamp)
│   ├── words.js     (100 kata + pemilihan acak)
│   └── storage.js   (LocalStorage)
└── README.md
```

## Cara Menjalankan di VS Code

1. Instal VS Code, lalu buka folder `bicara` (File → Open Folder).
2. Instal ekstensi **Live Server** (Ritwick Dey) dari tab Extensions.
3. Klik kanan `index.html` → **Open with Live Server** (atau tombol "Go Live" di pojok kanan bawah).
4. Browser terbuka di `http://127.0.0.1:5500`. Selesai.

Proyek ini memakai script biasa (bukan ES Modules), jadi `index.html` juga bisa dibuka langsung dengan klik dua kali.
Urutan script di `index.html` penting: `storage.js` → `words.js` → `timer.js` → `app.js`.

## Cara Memakai

1. Klik **Mulai Latihan**. Kata acak muncul; **Acak Ulang** hanya bisa dipakai sebelum timer riset dimulai.
2. Mulai timer riset 10 menit, tulis catatan, lalu klik **Saya Siap Berbicara** (atau tunggu waktu habis).
3. Mulai sesi bicara 1 menit. Layar memerah saat sisa 15 detik; ada bunyi saat waktu habis.
4. Isi evaluasi (4 penilaian wajib + catatan opsional), lalu simpan.
5. Lihat riwayat di halaman **Riwayat**. Tombol **Hapus Riwayat** dan **Reset Statistik** meminta konfirmasi.

## Ide Pengembangan

- Tambah kata: edit objek `BANK` di `js/words.js`.
- Ubah durasi: konstanta `RESEARCH_MS` dan `SPEAK_MS` di `js/app.js`.
- Data tersimpan di kunci `bicara.history.v1`, `bicara.stats.v1`, dan `bicara.used.v1`. Hapus lewat DevTools → Application → Local Storage.