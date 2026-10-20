# AI Maintenance Container Crane (CC) - PT Terminal Petikemas Surabaya

Website Sistem Informasi Pengelolaan Data Operasional & Maintenance Container Crane berbasis Engineering Management System & Industrial Dashboard untuk **PT Terminal Petikemas Surabaya (PT TPS)**.

---

## 1. Ringkasan Proyek

Sistem ini dirancang khusus untuk memonitor, mengelola, dan menganalisis seluruh aktivitas pemeliharaan armada Container Crane di dermaga PT TPS, meliputi:
- Pemantauan kesiapan unit Container Crane (CC01 s.d. CC38).
- Manajemen jadwal Preventive Maintenance (PM), Corrective Maintenance (CM), dan Breakdown Maintenance (BM).
- Pencatatan tiket Work Order (WO) dan durasi perbaikan teknis.
- Analisis statistik keandalan: **MMBF (Mean Moves Between Failures)**, **MTBF (Mean Time Between Failures)**, dan **MTTR (Mean Time To Repair)**.
- Analisis kegagalan **Pareto Big 6 Subsystem**.
- Asisten cerdas **AI Maintenance Copilot** (terintegrasi Gemini API pada arsitektur backend).

> **CATATAN STATUS TAHAP AWAL:**  
> Seluruh data yang ditampilkan saat ini menggunakan data contoh berlabel **[DEMO]** untuk keperluan visualisasi antarmuka dan interaksi pengguna. Sistem tidak menampilkan data dummy seolah-olah data aktual dermaga PT TPS.

---

## 2. Struktur File Proyek (Tahap 1)

Struktur file dibuat secara presisi sesuai dengan instruksi wajib:

```text
AI-Maintenance-CC/
│
├── .vscode/
│   └── settings.json
│
├── index.html
├── README.md
├── script.js
└── style.css
```

### Penjelasan Setiap File:
1. **`.vscode/settings.json`**: Pengaturan proyek Visual Studio Code, konfigurasi Live Server port 5500, format otomatis saat simpan, dan asosiasi tipe berkas.
2. **`index.html`**: Halaman utama berisi struktur semantik dashboard, 10 kelompok menu navigasi sidebar (A s.d. J), modal formulir, dan kontainer antarmuka.
3. **`style.css`**: Desain visual industrial slate/navy bertema dermaga pelabuhan, layout flexbox/grid responsif, palet status warna teknik, kartu statistik, dan tipografi engineering.
4. **`script.js`**: Logika Vanilla JavaScript murni mencakup router navigasi multi-view, mesin visualisasi grafik garis dua sumbu (*Dual-Axis Canvas Chart*), filter pencarian data, simulasi hak akses peran, serta mesin chatbot AI.
5. **`README.md`**: Dokumentasi lengkap panduan instalasi, cara menjalankan website, dan peta jalan arsitektur sistem.

*Penting: Pada tahap awal ini tidak digunakan Node.js, npm, package.json, framework eksternal (React/Vue/Laravel), maupun database XAMPP.*

---

## 3. Cara Menjalankan Website di Visual Studio Code

Website ini 100% menggunakan teknologi **HTML5, CSS3, dan Vanilla JavaScript murni**, sehingga dapat langsung dijalankan tanpa proses *build* atau instalasi paket tambahan.

### Opsi A: Menggunakan Ekstensi Live Server di VS Code (Direkomendasikan)
1. Buka folder `AI-Maintenance-CC` di **Visual Studio Code**.
2. Pastikan ekstensi **Live Server** (oleh *Ritwick Dey*) telah terpasang di VS Code.
3. Klik kanan pada file `index.html`.
4. Pilih **"Open with Live Server"** (atau klik tombol *Go Live* di status bar bawah VS Code).
5. Browser akan otomatis terbuka di alamat `http://127.0.0.1:5500/` atau `http://localhost:5500/`.

### Opsi B: Membuka Langsung Melalui Browser Web
1. Buka File Explorer di komputer Anda.
2. Masuk ke folder proyek: `d:\KP\Maintenance\AI-Maintenance-CC`.
3. Klik ganda (*double-click*) file `index.html`, atau klik kanan lalu pilih **Open With** → **Google Chrome / Microsoft Edge / Mozilla Firefox**.
4. Website akan langsung berjalan secara sempurna secara *offline*.

---

## 4. Struktur Menu Sidebar yang Tersedia

Navigasi sidebar terorganisir ke dalam 10 kelompok menu utama:

- **A. Dashboard**: Dashboard Utama, Dashboard Eksekutif, Statistik Produksi, Statistik Breakdown, Statistik Maintenance.
- **B. Data Container Crane**: Daftar Container Crane, Detail Container Crane, Spesifikasi Unit, Data Motor dan Drive, Data Subsystem, Data Komponen.
- **C. Maintenance**: Maintenance Harian, Mingguan, Bulanan, Tahunan, Preventive Maintenance (PM), Corrective Maintenance (CM), Breakdown Maintenance (BM), Daftar Pekerjaan Maintenance, Kondisi Unit & Subsystem, Riwayat Maintenance.
- **D. Work Order**: Daftar Work Order, Input Work Order, Detail Work Order, Riwayat Work Order.
- **E. Data Operasional**: Data Produksi, Waktu Operasional, Data Breakdown, Data Downtime.
- **F. Arsip dan Riwayat**: Riwayat Kerusakan, Riwayat Perbaikan, Arsip Field Memory, Dokumen Pendukung.
- **G. Laporan dan Analisis**: Laporan Maintenance, Laporan Breakdown, Laporan Work Order, Analisis MMBF, Analisis MTBF, Analisis MTTR, Analisis Big 6, Laporan Produksi & Operasional.
- **H. AI Assistant**: Chat AI Maintenance, Pencarian Riwayat Kerusakan, Analisis Troubleshooting, Rekomendasi Perbaikan.
- **I. Input Center**: Input Manual, Import Excel & CSV, Import PDF & Word, Upload Gambar, Import URL Dokumen, Integrasi Google Drive / Google Sheets, Integrasi OneDrive, Riwayat Import Data.
- **J. Pengaturan**: Manajemen Pengguna, Manajemen Role & Hak Akses, Master Data, Pengaturan Parameter, Backup & Restore, Activity Log.

---

## 5. Fitur Unggulan Antarmuka (Tahap 1)

1. **Grafik Garis Dual Y-Axis Murni (Canvas Engine)**:
   - Sumbu Kiri: Jumlah Produksi (*Moves*).
   - Sumbu Kanan: Jumlah Breakdown & Work Order (*Kejadian / Order*).
   - Interaktif dengan garis pemandu vertikal (*crosshair*) dan kartu tooltip informasi saat kursor digerakkan.
   - Filter tahun, bulan, dan unit Container Crane.
2. **Katalog Spesifikasi Lengkap Unit CC**:
   - Tab navigasi untuk Identitas & Dimensi (Outreach, Backreach, Lifting Height, Rail Span).
   - Rincian Motor Listrik (Main Hoist 2x450 kW, Boom Hoist 160 kW, Trolley 2x55 kW, Gantry 16x11 kW).
   - Inverter Drive (Siemens Sinamics S120) & Redundant PLC Simatic S7-400.
3. **Simulasi Role-Based Access Control (RBAC)**:
   - **Admin**: Hak akses penuh (Create, Read, Update, Delete) di semua modul.
   - **Maintenance**: Hak input pemeliharaan, Work Order, dan penggunaan AI Copilot.
   - **Viewer**: Mode baca saja (*Read-Only*) untuk pemantauan manajemen eksekutif.
   - Pilihan simulasi peran dapat diuji langsung melalui dropdown *Peran* di bagian header.
4. **AI Maintenance Copilot (Arsitektur Khusus Perawatan Crane)**:
   - Tampilan chatbot teknik interaktif.
   - Pemisahan tegas antara **Fakta Arsip Maintenance** dan **Analisis Kemungkinan Penyebab**.
   - Canned prompt chips untuk pertanyaan umum troubleshooting.
   - Indikasi keamanan: integrasi Gemini API sesungguhnya akan dilindungi melalui *backend service*.
5. **Desain Responsif Penuh (Mobile, Tablet, Desktop)**:
   - *Drawer navigation* samping dengan *overlay backdrop* dan tombol tutup (*close button*) di perangkat seluler.
   - Penataan kartu statistik (2 kolom pada smartphone, 1 kolom pada layar kecil).
   - *Dual-Axis Canvas Chart* mendukung interaksi *touchmove* / *touchend* di layar sentuh ponsel dan tablet.
   - Tabel data dilengkapi *smooth touch horizontal scrolling* agar seluruh kolom tetap terbaca rapi.
   - Formulir input dan modal dialog otomatis disesuaikan secara proporsional di smartphone.

---

## 6. Peta Jalan Arsitektur Backend & Database (Tahap Lanjutan)

Ketika fondasi frontend telah diverifikasi, pengembangan akan dilanjutkan ke tahap backend dengan spesifikasi relasional 18 tabel:

1. `Users`
2. `Roles`
3. `Container_Cranes`
4. `Crane_Specifications`
5. `Motors`
6. `Subsystems`
7. `Components`
8. `Production_Records`
9. `Operation_Records`
10. `Breakdown_Records`
11. `Maintenance_Records`
12. `Work_Orders`
13. `Maintenance_Tasks`
14. `Repair_Histories`
15. `Field_Memory_Archives`
16. `Documents`
17. `AI_Conversations`
18. `Activity_Logs`

### Keamanan Gemini API:
API Key Gemini tidak akan diletakkan di JavaScript frontend agar tidak terekspos ke publik. Komunikasi AI akan melalui REST API backend yang memvalidasi otentikasi JWT sebelum memanggil Google Gemini API.

---

## 7. Pengembang & Hak Cipta

- **Sistem**: AI Maintenance Container Crane (CC)
- **Instansi**: PT Terminal Petikemas Surabaya (PT TPS)
- **Teknologi Awal**: HTML5, CSS3, Vanilla JavaScript (ES6+), SVG, Canvas API.
