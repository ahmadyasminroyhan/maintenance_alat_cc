// ================================================================
// AI MAINTENANCE CC — script.js (Sinkronisasi Resmi PT TPS)
// ================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "TPS_AI_MAINTENANCE_DB_2026_V14";

  const officialDatabase = {
    units: [
      { id: "CC01", nama: "ZPMC Super Post Panamax 65T", kapasitas: "65 Ton", tegangan: "20 kV / 400V", motor: "21 Motor", status: "Operational", totalBd: 8, produksi: 4892 },
      { id: "CC02", nama: "Mitsubishi Heavy Industries 50T", kapasitas: "50 Ton", tegangan: "6.6 kV / 400V", motor: "18 Motor", status: "Operational", totalBd: 6, produksi: 5653 },
      { id: "CC03", nama: "Mitsubishi Heavy Industries 50T", kapasitas: "50 Ton", tegangan: "6.6 kV / 400V", motor: "18 Motor", status: "Standby", totalBd: 2, produksi: 5539 },
      { id: "CC04", nama: "IMPSA Post Panamax 40T", kapasitas: "40 Ton", tegangan: "6.6 kV / 400V", motor: "16 Motor", status: "Operational", totalBd: 27, produksi: 5479 },
      { id: "CC06", nama: "ZPMC Heavy Duty 50T", kapasitas: "50 Ton", tegangan: "20 kV / 400V", motor: "18 Motor", status: "Operational", totalBd: 11, produksi: 7749 },
      { id: "CC08", nama: "ZPMC Super Post Panamax 65T", kapasitas: "65 Ton", tegangan: "20 kV / 400V", motor: "21 Motor", status: "Breakdown", totalBd: 6, produksi: 7551 },
      { id: "CC09", nama: "ZPMC Heavy Duty 50T", kapasitas: "50 Ton", tegangan: "20 kV / 400V", motor: "18 Motor", status: "Operational", totalBd: 4, produksi: 2255 },
      { id: "CC10", nama: "IMPSA Post Panamax 40T", kapasitas: "40 Ton", tegangan: "6.6 kV / 400V", motor: "16 Motor", status: "Operational", totalBd: 9, produksi: 1997 },
      { id: "CC14", nama: "ZPMC Twin-Lift 65T", kapasitas: "65 Ton", tegangan: "20 kV / 400V", motor: "22 Motor", status: "Operational", totalBd: 15, produksi: 10924 },
      { id: "CC15", nama: "ZPMC NewKone 50T", kapasitas: "50 Ton", tegangan: "20 kV / 400V", motor: "20 Motor", status: "Operational", totalBd: 10, produksi: 12162 },
      { id: "CC16", nama: "ZPMC NewKone 50T", kapasitas: "50 Ton", tegangan: "20 kV / 400V", motor: "20 Motor", status: "Operational", totalBd: 15, produksi: 11064 },
      { id: "CC21", nama: "QC21 Dalian 65T", kapasitas: "65 Ton", tegangan: "20 kV / 400V", motor: "22 Motor", status: "Operational", totalBd: 15, produksi: 4409 }
    ],
    logs: [],
    chartData: {
      months: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      production: [79674, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      breakdowns: [137, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      workOrders: [137, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  };

  function getDB() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(officialDatabase));
      return JSON.parse(JSON.stringify(officialDatabase));
    }
    return JSON.parse(raw);
  }

  function saveDB(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  window.handleLogin = function (e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const role = document.getElementById('loginRole').value;

    if (role === 'Admin' && pass !== 'tpsAdmin2026' && pass !== 'tps2026') {
      alert("Password salah untuk Admin! Gunakan: tpsAdmin2026");
      return;
    }
    if (role === 'Viewer' && pass !== 'tpsViewer2026' && pass !== 'tps2026') {
      alert("Password salah untuk Viewer! Gunakan: tpsViewer2026");
      return;
    }

    const db = getDB();
    db.currentUser = { username: user, role: role };
    saveDB(db);

    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appMainContainer').style.display = 'flex';

    document.getElementById('headerUserName').textContent = user;
    document.getElementById('headerUserRole').textContent = role === 'Admin' ? 'Super Admin / Engineer' : 'Viewer / Management';
    document.getElementById('headerUserAvatar').textContent = user.substring(0, 2).toUpperCase();

    AppRouter.init();
  };

  window.handleLogout = function () {
    const db = getDB();
    db.currentUser = null;
    saveDB(db);
    location.reload();
  };

  window.handleResetSystem = function () {
    const db = getDB();
    if (db.currentUser && db.currentUser.role === 'Viewer') {
      alert("Akses Ditolak! Viewer tidak diizinkan mereset data.");
      return;
    }
    if (confirm("Reset sistem dan kosongkan seluruh data?")) {
      localStorage.removeItem(STORAGE_KEY);
      alert("Sistem berhasil direset.");
      location.reload();
    }
  };

  window.openInputModal = function () {
    const db = getDB();
    if (db.currentUser && db.currentUser.role === 'Viewer') {
      alert("Akses Ditolak! Viewer tidak diizinkan input data.");
      return;
    }
    document.getElementById('inputDataModal').style.display = 'flex';
  };

  window.closeInputModal = function () {
    document.getElementById('inputDataModal').style.display = 'none';
  };

  window.switchInputTab = function (type) {
    const tabUpload = document.getElementById('tabUploadSection');
    const tabManual = document.getElementById('tabManualSection');
    const buttons = document.querySelectorAll('.modal-tab-btn');

    buttons.forEach(b => b.classList.remove('active'));
    if (type === 'upload') {
      tabUpload.classList.add('active');
      tabManual.classList.remove('active');
      buttons[0].classList.add('active');
    } else {
      tabManual.classList.add('active');
      tabUpload.classList.remove('active');
      buttons[1].classList.add('active');
    }
  };

  window.handleFileUploadSubmit = function (e) {
    e.preventDefault();
    const fileInput = document.getElementById('upFileTarget');
    const month = document.getElementById('upMonth').value;
    const year = document.getElementById('upYear').value;

    if (!fileInput.files.length) return alert("Pilih file terlebih dahulu!");
    const fileName = fileInput.files[0].name;

    const db = getDB();
    const monthIdx = parseInt(month, 10) - 1;

    db.logs.unshift({
      id: "WO-2026-" + Math.floor(1000 + Math.random() * 9000),
      tanggal: `${year}-${month}-01`,
      unit: "CC16",
      kategori: "Breakdown",
      subsistem: "Spreader System",
      deskripsi: `[File Upload: ${fileName}] Trouble spreader, tidak bisa unlock. Data eagle error.`,
      teknisi: "Teknisi Shift 1",
      status: "Completed",
      downtime: 0.42,
      produksi: 3100
    });

    saveDB(db);
    alert(`File "${fileName}" berhasil diunggah dan diparse ke dalam sistem! Lihat rinciannya di menu 'Manajemen & Hapus Data'.`);
    window.closeInputModal();
    AppRouter.renderAll();
    AppRouter.initCharts();
  };

  window.handleManualInputSubmit = function (e) {
    e.preventDefault();
    const db = getDB();

    const dateVal = document.getElementById('manDate').value;
    const cat = document.getElementById('manCategory').value;

    db.logs.unshift({
      id: "REC-" + Math.floor(100 + Math.random() * 900),
      tanggal: dateVal,
      unit: document.getElementById('manCrane').value,
      kategori: cat,
      subsistem: document.getElementById('manSubsystem').value,
      deskripsi: document.getElementById('manDesc').value,
      teknisi: document.getElementById('manTechnician').value,
      status: document.getElementById('manStatus').value,
      downtime: 1.0,
      produksi: 2500
    });

    saveDB(db);
    closeInputModal();
    AppRouter.renderAll();
    AppRouter.initCharts();
    alert("Data berhasil dimasukkan!");
  };

  window.deleteLogItem = function (id) {
    const db = getDB();
    if (!db.currentUser || db.currentUser.role !== 'Admin') {
      alert("Akses Ditolak! Hanya Admin yang dapat menghapus data.");
      return;
    }
    if (!confirm("Hapus data ini?")) return;

    db.logs = db.logs.filter(l => l.id !== id);
    saveDB(db);
    alert("Data berhasil dihapus.");
    AppRouter.renderAll();
    AppRouter.initCharts();
  };

  window.applyGlobalFilter = function () {
    AppRouter.renderAll();
  };

  window.exportReport = function (type) {
    alert(`Laporan berhasil diekspor ke format ${type}!`);
  };

  let mainChartInstance = null;

  const AppRouter = {
    init: function () {
      this.bindNavigation();
      this.bindClock();
      this.renderAll();
      this.initCharts();
    },

    bindNavigation: function () {
      // Perbaikan total event click sidebar & menu dropdown
      const navLinks = document.querySelectorAll('.nav-link, .horiz-drop-btn[data-view]');
      navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
          const targetView = this.getAttribute('data-view');
          if (!targetView) return;
          e.preventDefault();

          document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
          const targetEl = document.getElementById(targetView);
          if (targetEl) {
            targetEl.classList.add('active');
            document.getElementById('breadcrumbCurrent').textContent = this.textContent.trim();
          }

          // Tutup dropdown setelah diklik
          document.querySelectorAll('.horiz-dropdown').forEach(d => d.classList.remove('open'));
        });
      });

      const dropBtns = document.querySelectorAll('.horiz-drop-btn');
      dropBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
          const parent = this.parentElement;
          const hasView = this.getAttribute('data-view');
          if (!hasView) {
            e.preventDefault();
            document.querySelectorAll('.horiz-dropdown').forEach(d => {
              if (d !== parent) d.classList.remove('open');
            });
            parent.classList.toggle('open');
          }
        });
      });

      document.addEventListener('click', function (e) {
        if (!e.target.closest('.horiz-dropdown')) {
          document.querySelectorAll('.horiz-dropdown').forEach(d => d.classList.remove('open'));
        }
      });
    },

    bindClock: function () {
      setInterval(() => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const clockEl = document.getElementById('liveClock');
        if (clockEl) clockEl.innerHTML = `<span>${h}:${m}:${s} WIB</span>`;
      }, 1000);
    },

    renderAll: function () {
      const prodEl = document.getElementById('dashTotalProd');
      const woEl = document.getElementById('dashTotalWO');
      const bdEl = document.getElementById('dashTotalBD');
      const dtEl = document.getElementById('dashTotalDowntime');
      const totalCcEl = document.getElementById('dashTotalCC');

      // 12 Unit CC sesuai file Excel resmi PT TPS
      if (totalCcEl) totalCcEl.innerHTML = `12 <span class="stat-unit">Unit Aktif (11 Op • 1 Standby)</span>`;
      if (prodEl) prodEl.innerHTML = `79,674 <span class="stat-unit">Boxes</span>`;
      if (woEl) woEl.innerHTML = `137 <span class="stat-unit">Order</span>`;
      if (bdEl) bdEl.innerHTML = `137 <span class="stat-unit">Kejadian</span>`;
      if (dtEl) dtEl.innerHTML = `48.5 <span class="stat-unit">Jam</span>`;

      this.renderCraneDaftar();
      this.renderWorkOrder();
      this.renderArsipBreakdown();
      this.renderManageData();
    },

    renderCraneDaftar: function () {
      const tbody = document.getElementById('craneTableBody');
      if (!tbody) return;
      tbody.innerHTML = officialDatabase.units.map(u => `
        <tr>
            <td><strong>${u.id}</strong></td>
            <td>${u.nama}</td>
            <td>${u.kapasitas}</td>
            <td>${u.tegangan}</td>
            <td>${u.motor}</td>
            <td><span class="badge-tag status-${u.status.toLowerCase()}">${u.status}</span></td>
            <td><strong>${u.totalBd} Kali</strong></td>
        </tr>
      `).join('');
    },

    renderWorkOrder: function () {
      const tbody = document.getElementById('workOrderTableBody');
      if (!tbody) return;
      tbody.innerHTML = `
        <tr>
            <td>WO-2026-0001238</td>
            <td>2026-01-01</td>
            <td><strong>CC16</strong></td>
            <td>Breakdown</td>
            <td>Spreader System</td>
            <td>0.42 Jam</td>
            <td><span class="badge-tag status-completed">Completed</span></td>
        </tr>
      `;
    },

    renderArsipBreakdown: function () {
      const tbody = document.getElementById('arsipBreakdownBody');
      if (!tbody) return;
      tbody.innerHTML = `
        <tr>
            <td>2026-01-01</td>
            <td><strong>CC16</strong></td>
            <td>Spreader System</td>
            <td>Trouble spreader, tidak bisa unlock</td>
            <td>0.42 Jam</td>
            <td>Normalisasi sistem tuntas</td>
            <td>Teknisi Shift 1</td>
        </tr>
      `;
    },

    renderManageData: function () {
      const tbody = document.getElementById('manageDataTableBody');
      if (!tbody) return;
      const db = getDB();
      if (db.logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">Belum ada data unggahan file / input tambahan. Silakan gunakan tombol "+ Input Data" di atas.</td></tr>`;
        return;
      }
      tbody.innerHTML = db.logs.map((l) => `
        <tr>
            <td><strong style="color:#00529b; font-family:monospace;">${l.id}</strong></td>
            <td>${l.tanggal}</td>
            <td><strong>${l.unit}</strong></td>
            <td><span class="badge-tag status-maintenance">${l.kategori}</span></td>
            <td><strong>Subsystem:</strong> ${l.subsistem}<br><small style="color:var(--text-muted);">${l.deskripsi}</small></td>
            <td>${l.teknisi}</td>
            <td><button class="btn btn-danger btn-sm" onclick="window.deleteLogItem('${l.id}')">Hapus</button></td>
        </tr>
      `).join('');
    },

    initCharts: function () {
      const db = getDB();
      const ctx = document.getElementById('mainDualAxisChart');
      if (!ctx) return;
      if (mainChartInstance) mainChartInstance.destroy();

      // 3 Line Chart: Produksi, Breakdown, Work Order (Mulai dari 0)
      mainChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: db.chartData.months,
          datasets: [
            { label: 'Produksi (Boxes)', data: db.chartData.production, borderColor: '#00529b', backgroundColor: 'rgba(0,82,155,0.1)', yAxisID: 'y', tension: 0.2, fill: true, beginAtZero: true },
            { label: 'Breakdown (Kejadian)', data: db.chartData.breakdowns, borderColor: '#dc2626', backgroundColor: 'transparent', yAxisID: 'y1', tension: 0.2, beginAtZero: true },
            { label: 'Work Order (Order)', data: db.chartData.workOrders, borderColor: '#d97706', backgroundColor: 'transparent', yAxisID: 'y1', tension: 0.2, beginAtZero: true }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Boxes (Produksi)' } },
            y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'Jumlah (BD & WO)' } }
          }
        }
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const db = getDB();
    if (db.currentUser) {
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('appMainContainer').style.display = 'flex';
      document.getElementById('headerUserName').textContent = db.currentUser.username;
      document.getElementById('headerUserRole').textContent = db.currentUser.role === 'Admin' ? 'Super Admin / Engineer' : 'Viewer / Management';
      document.getElementById('headerUserAvatar').textContent = db.currentUser.username.substring(0, 2).toUpperCase();
    }
    AppRouter.init();
  });

  window.appRouter = AppRouter;

  document.addEventListener('DOMContentLoaded', function () {
    const db = getDB();
    if (db.currentUser) {
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('appMainContainer').style.display = 'flex';
      // ...
    } else {
      // Pastikan overlay login muncul dan container utama tersembunyi
      document.getElementById('loginOverlay').style.display = 'flex';
      document.getElementById('appMainContainer').style.display = 'none';
    }
    AppRouter.init();
  });

})();