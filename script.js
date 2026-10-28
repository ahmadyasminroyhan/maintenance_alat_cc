// ==========================================
// KODE UTUH SCRIPT.JS - AI MAINTENANCE CC PT TPS (RESPONSIF MOBILE & PRESISI)
// ==========================================

const AUTH_CONFIG = { adminPassword: 'admin123', teknisiPassword: 'teknisi123' };
const VALID_TPS_UNITS = ['CC01', 'CC02', 'CC03', 'CC04', 'CC06', 'CC08', 'CC09', 'CC10', 'CC14', 'CC15', 'CC16', 'CC21', 'CC22', 'CC23', 'CC24', 'CC25'];

let uploadedDataStore = JSON.parse(localStorage.getItem('tps_uploaded_store_v26') || '{}');
let currentUserRole = localStorage.getItem('tps_current_role') || null;
let currentUsername = localStorage.getItem('tps_current_username') || "Teknisi_TPS";

let allUserChatSessions = JSON.parse(localStorage.getItem('tps_chat_sessions_v3') || '{}');
let activeSessionId = localStorage.getItem('tps_active_session_id') || null;

let archiveCurrentLevel = 'YEAR';
let archiveSelectedYear = null;
let archiveSelectedMonth = null;

function saveStore() { localStorage.setItem('tps_uploaded_store_v26', JSON.stringify(uploadedDataStore)); }
function saveChatSessions() { localStorage.setItem('tps_chat_sessions_v3', JSON.stringify(allUserChatSessions)); }

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const clockEl = document.getElementById('headerClock');
  if (clockEl) clockEl.innerText = `${hours}:${minutes}:${seconds} WIB`;
}
setInterval(updateClock, 1000);

function handleLogin(e) {
  e.preventDefault();
  const role = document.getElementById('loginRole').value;
  const uname = document.getElementById('loginUsername').value.trim();
  const pass = document.getElementById('loginPassword').value;

  if (role === 'admin' && pass === AUTH_CONFIG.adminPassword) currentUserRole = 'admin';
  else if (role === 'teknisi' && pass === AUTH_CONFIG.teknisiPassword) currentUserRole = 'teknisi';
  else return alert('Kata sandi salah! Gunakan: admin123 atau teknisi123.');

  currentUsername = uname || (role === 'admin' ? 'Administrator_TPS' : 'Teknisi_TPS');
  localStorage.setItem('tps_current_role', currentUserRole);
  localStorage.setItem('tps_current_username', currentUsername);
  document.getElementById('loginModal').classList.add('hidden');
  applyRolePermissions();
  initUserChatSessions();
  showToast(`Halo ${currentUsername}, selamat bertugas!`);
}

function logoutSystem() {
  if (confirm('Keluar dari sesi ini?')) {
    localStorage.removeItem('tps_current_role');
    localStorage.removeItem('tps_current_username');
    localStorage.removeItem('tps_active_session_id');
    location.reload();
  }
}

function applyRolePermissions() {
  const roleNameEl = document.getElementById('userProfileName');
  const roleDescEl = document.getElementById('userProfileRole');
  const resetBtn = document.getElementById('resetDataBtn');
  const actionControls = document.getElementById('headerActionControls');
  const navbarMenu = document.getElementById('headerNavbarMenu');
  const initialBadge = document.getElementById('userInitialBadge');

  if (actionControls) { actionControls.classList.remove('hidden'); actionControls.classList.add('flex'); }
  if (navbarMenu) navbarMenu.classList.remove('hidden');
  if (roleNameEl) roleNameEl.innerText = currentUsername;
  if (initialBadge) initialBadge.innerText = currentUsername.substring(0, 2).toUpperCase();

  if (currentUserRole === 'admin') {
    if (roleDescEl) roleDescEl.innerText = "Administrator / Ops";
    if (resetBtn) resetBtn.classList.remove('hidden');
  } else {
    if (roleDescEl) roleDescEl.innerText = "Teknisi Lapangan";
    if (resetBtn) resetBtn.classList.add('hidden');
  }
}

function toggleInputDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('inputDropdownMenu');
  const dashMenu = document.getElementById('dashboardDropdownMenu');
  if (dashMenu) dashMenu.classList.add('hidden');
  if (menu) menu.classList.toggle('hidden');
}

function toggleDashboardDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('dashboardDropdownMenu');
  const inputMenu = document.getElementById('inputDropdownMenu');
  if (inputMenu) inputMenu.classList.add('hidden');
  if (menu) menu.classList.toggle('hidden');
}

window.addEventListener('click', () => {
  const menu = document.getElementById('inputDropdownMenu');
  const dashMenu = document.getElementById('dashboardDropdownMenu');
  if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
  if (dashMenu && !dashMenu.classList.contains('hidden')) dashMenu.classList.add('hidden');
});

function openUploadModal() { document.getElementById('uploadModal').classList.remove('hidden'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.add('hidden'); }
function openManualModal() { document.getElementById('manualModal').classList.remove('hidden'); }
function closeManualModal() { document.getElementById('manualModal').classList.add('hidden'); }
function openProductionModal() { document.getElementById('productionModal').classList.remove('hidden'); }
function closeProductionModal() { document.getElementById('productionModal').classList.add('hidden'); }

function switchTab(tabId) {
  const dashMenu = document.getElementById('dashboardDropdownMenu');
  if (dashMenu) dashMenu.classList.add('hidden');

  document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById('section-' + tabId);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-link-btn').forEach(btn => btn.classList.remove('nav-active'));
  if (tabId === 'dashboard' || tabId === 'analytics') {
    const activeBtn = document.getElementById('nav-btn-dashboard');
    if (activeBtn) activeBtn.classList.add('nav-active');
  } else {
    const otherBtn = document.getElementById('nav-btn-' + tabId);
    if (otherBtn) otherBtn.classList.add('nav-active');
  }

  if (tabId === 'files') renderFileArchiveTable();
  if (tabId === 'ai') {
    renderChatHistorySidebar();
    renderActiveChatMessages();
  }
  if (['dashboard', 'analytics', 'units'].includes(tabId)) {
    window.dispatchEvent(new Event('resize'));
    applyGlobalFilter();
  }
}

function hasAnyData() { return Object.keys(uploadedDataStore).length > 0; }

function renderUI() {
  const statusBadge = document.getElementById('dataStatusBadge');
  if (!hasAnyData()) {
    if (statusBadge) {
      statusBadge.className = "bg-slate-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full font-medium whitespace-nowrap";
      statusBadge.innerText = "BELUM ADA DATA (0)";
    }
    document.getElementById('activeFileIndicator').innerText = "Status: Belum ada file yang diunggah";
    document.getElementById('cardTotalCrane').innerText = "0";
    document.getElementById('cardTotalBoxes').innerText = "0";
    document.getElementById('cardTotalBD').innerText = "0";
    document.getElementById('cardTotalMmbf').innerText = "0";
    document.getElementById('cardTotalDowntime').innerText = "0 Jam";
    document.getElementById('unitTableBody').innerHTML = VALID_TPS_UNITS.map(u => `<tr class="border-b"><td class="p-3 font-bold text-primary">${u}</td><td class="p-3 text-slate-700">Container Crane Unit ${u}</td><td class="p-3 text-slate-400">Belum ada data operasional</td></tr>`).join('');
    document.getElementById('woTableBody').innerHTML = `<tr><td colspan="9" class="p-6 text-center text-slate-400">- Belum Ada Data Aktual -</td></tr>`;
    renderCharts();
    return;
  }
  if (statusBadge) {
    statusBadge.className = "bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full font-medium whitespace-nowrap";
    statusBadge.innerText = "DATA AKTIF";
  }
  applyGlobalFilter();
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  document.getElementById('toastMessage').innerText = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

function normalizeUnitAsset(rawAsset) {
  if (!rawAsset) return null;
  let str = String(rawAsset).toUpperCase().trim();
  for (let u of VALID_TPS_UNITS) {
    if (str.includes(u) || str.includes(u.replace('CC', 'QC')) || str.endsWith(u.replace('CC', ''))) return u;
  }
  return null;
}

function parseValidDate(rawDate, defaultYear = '2026') {
  if (!rawDate) return `${defaultYear}-01-01`;
  let str = String(rawDate).trim();
  if (!isNaN(str) && Number(str) > 30000) {
    let utc_days = Math.floor(Number(str) - 25569);
    let date_info = new Date(utc_days * 86400 * 1000);
    let y = date_info.getFullYear();
    let m = String(date_info.getMonth() + 1).padStart(2, '0');
    let d = String(date_info.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  let cleaned = str.split('T')[0].split(' ')[0];
  if (cleaned.length >= 8) return cleaned;
  return `${defaultYear}-01-01`;
}

function dataBulananKosong(year, month, fileName) {
  const boxesPerCC = {}, timeOpPerCC = {}, bdPerCC = {}, dtPerCC = {};
  const boxesDailyPerCC = {}, timeOpDailyPerCC = {}, bdDailyPerCC = {};

  VALID_TPS_UNITS.forEach(unit => {
    boxesPerCC[unit] = 0; timeOpPerCC[unit] = 0; bdPerCC[unit] = 0; dtPerCC[unit] = 0;
    boxesDailyPerCC[unit] = new Array(31).fill(0);
    timeOpDailyPerCC[unit] = new Array(31).fill(0);
    bdDailyPerCC[unit] = new Array(31).fill(0);
  });

  return {
    fileName,
    year: String(year),
    month,
    units: [...VALID_TPS_UNITS],
    totalCC: VALID_TPS_UNITS.length,
    boxes: 0, bd: 0, mmbf: 0, downtime: 0,
    workOrders: [],
    cancelledWorkOrders: [],
    boxesPerCC, timeOpPerCC, bdPerCC, dtPerCC,
    boxesDailyPerCC, timeOpDailyPerCC, bdDailyPerCC
  };
}

function submitManualForm(e) {
  e.preventDefault();
  const date = document.getElementById('manDate').value;
  const year = date.split('-')[0] || "2026";
  const monthNum = date.split('-')[1] || "01";
  const dayStr = date.split('-')[2] || "01";
  const dayIdx = parseInt(dayStr, 10) - 1;
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const monthName = months[parseInt(monthNum, 10) - 1] || "Januari";

  const crane = document.getElementById('manCrane').value;
  const customWoNum = document.getElementById('manWoNum').value.trim();
  const subsystem = document.getElementById('manSubsystem').value;
  const desc = document.getElementById('manDesc').value;
  const downtime = parseFloat(document.getElementById('manDowntime').value) || 0;

  let key = `${year}-${monthName}`;
  if (!uploadedDataStore[key]) {
    uploadedDataStore[key] = dataBulananKosong(year, monthName, `Database (${monthName} ${year})`);
  }

  let ds = uploadedDataStore[key];
  ds.bd += 1;
  ds.downtime += downtime;
  if (!ds.units.includes(crane)) ds.units.push(crane);

  ds.bdPerCC[crane] += 1;
  ds.dtPerCC[crane] += downtime;
  if (!ds.bdDailyPerCC[crane]) ds.bdDailyPerCC[crane] = new Array(31).fill(0);
  ds.bdDailyPerCC[crane][dayIdx] = (ds.bdDailyPerCC[crane][dayIdx] || 0) + 1;

  ds.workOrders.push({
    tanggal: parseValidDate(date, year),
    woNum: customWoNum,
    desc: desc,
    type: "Breakdown",
    asset: crane,
    durasiStr: downtime.toFixed(1) + " Jam",
    durasiNum: downtime,
    task: subsystem,
    status: 'COMPLETED',
    dateSource: 'Manual Teknisi'
  });

  saveStore(); closeManualModal(); renderUI();
  showToast('Data WO Maintenance berhasil disimpan!');
}

function submitProductionForm(e) {
  e.preventDefault();
  const date = document.getElementById('prodDate').value;
  const year = date.split('-')[0] || "2026";
  const monthNum = date.split('-')[1] || "01";
  const dayStr = date.split('-')[2] || "01";
  const dayIdx = parseInt(dayStr, 10) - 1;
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const monthName = months[parseInt(monthNum, 10) - 1] || "Januari";

  const crane = document.getElementById('prodCrane').value;
  const boxes = parseFloat(document.getElementById('prodBoxes').value) || 0;

  let key = `${year}-${monthName}`;
  if (!uploadedDataStore[key]) {
    uploadedDataStore[key] = dataBulananKosong(year, monthName, `Database (${monthName} ${year})`);
  }

  let ds = uploadedDataStore[key];
  ds.boxes += boxes;
  ds.boxesPerCC[crane] = (ds.boxesPerCC[crane] || 0) + boxes;
  if (!ds.boxesDailyPerCC[crane]) ds.boxesDailyPerCC[crane] = new Array(31).fill(0);
  ds.boxesDailyPerCC[crane][dayIdx] = (ds.boxesDailyPerCC[crane][dayIdx] || 0) + boxes;

  saveStore(); closeProductionModal(); renderUI();
  showToast('Data Produksi Box berhasil disimpan!');
}

function isWorkOrderCancelled(row, normalisasiFn) {
  const keys = Object.keys(row || {});
  const statusKey = keys.find(k => /status/i.test(normalisasiFn(k)));
  const statusVal = statusKey ? String(row[statusKey] || '').toUpperCase() : '';

  const descKey = keys.find(k => /description|short text|problem/i.test(normalisasiFn(k)));
  const descVal = descKey ? String(row[descKey] || '').toUpperCase() : '';

  const combined = `${statusVal} ${descVal}`;
  return /\bCANCEL(?:LED|ED)?\b|\bDIBATALKAN\b|\bCANCELED\b/.test(combined);
}

function processUploadedFile() {
  const fileInput = document.getElementById('actualFileInput');
  const yearSel = document.getElementById('uploadYear')?.value || String(new Date().getFullYear());
  const monthSel = document.getElementById('uploadMonth')?.value || 'Januari';

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert('Pilih berkas Excel terlebih dahulu!');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function normalisasiNamaKolom(v) {
    return String(v ?? '').toLowerCase().trim().replace(/[\r\n]+/g, ' ').replace(/[._/-]+/g, ' ').replace(/\s+/g, ' ');
  }

  function ambilKolom(row, kandidat) {
    const keys = Object.keys(row || {});
    const normalizedKeys = keys.map(k => ({ asli: k, normal: normalisasiNamaKolom(k) }));
    for (const nama of kandidat) {
      const target = normalisasiNamaKolom(nama);
      const found = normalizedKeys.find(k => k.normal === target || k.normal.includes(target));
      if (found && row[found.asli] !== undefined && row[found.asli] !== null) {
        const value = row[found.asli];
        if (String(value).trim() !== '') return value;
      }
    }
    return null;
  }

  function angkaAman(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const text = String(value).trim();
    if (!text || text.startsWith('#')) return 0;
    const cleaned = text.replace(/\s/g, '').replace(/jam/ig, '');
    if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(cleaned)) return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    if (/^-?\d+,\d+$/.test(cleaned)) return Number(cleaned.replace(',', '.')) || 0;
    return Number(cleaned) || 0;
  }

  function tanggalISO(value) {
    if (!value) return null;
    if (typeof value === 'number' && value > 20000 && value < 100000) {
      const date = XLSX.SSF.parse_date_code(value);
      if (date && date.y && date.m && date.d) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }
    if (value instanceof Date && !isNaN(value)) {
      let y = value.getFullYear();
      let m = String(value.getMonth() + 1).padStart(2, '0');
      let d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const raw = String(value).trim();
    let match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (match) return `${match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
    return null;
  }

  reader.onload = function (event) {
    try {
      const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array', cellDates: true });
      const targetKey = `${yearSel}-${monthSel}`;
      const dataBulan = dataBulananKosong(yearSel, monthSel, file.name);
      const woDilihat = new Set();

      workbook.SheetNames.forEach(sheetName => {
        const cleanSheet = sheetName.trim().toLowerCase();

        // 1. PARSER SHEET LIST OF WORK ORDERS
        if (cleanSheet.includes('work order') || cleanSheet.includes('list of wo')) {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

          rows.forEach(row => {
            const woRaw = ambilKolom(row, ['Work Order', 'Order', 'WO', 'No WO', 'WO Number', 'Tiket', 'No']);
            const rawAsset = String(ambilKolom(row, ['Asset', 'Equipment', 'Unit', 'UNIT', 'Crane', 'No Crane']) || '');
            const asset = normalizeUnitAsset(rawAsset);

            if (!woRaw || !asset) return;

            const woNum = String(woRaw).trim();
            const description = String(ambilKolom(row, ['Description', 'Short Text', 'Problem', 'ACTION TAKEN', 'Keterangan']) || '-').trim();
            const workType = String(ambilKolom(row, ['Work Type', 'Type', 'Tipe']) || 'Breakdown').trim();

            const actualStart = ambilKolom(row, ['DATE Start', 'Date Start', 'Actual Start', 'Doc. date', 'Tanggal']);
            let parsedDate = tanggalISO(actualStart);
            let dayNum = 1;

            if (parsedDate) {
              dayNum = parseInt(parsedDate.slice(8, 10), 10) || 1;
            }

            let monthIdxModal = MONTHS_ID.indexOf(monthSel) + 1;
            let monthStrModal = String(monthIdxModal > 0 ? monthIdxModal : 1).padStart(2, '0');
            parsedDate = `${yearSel}-${monthStrModal}-${String(dayNum).padStart(2, '0')}`;

            const dayIdx = Math.max(0, Math.min(30, dayNum - 1));
            const woObject = {
              tanggal: parsedDate,
              woNum,
              desc: description,
              type: workType,
              asset,
              durasiNum: Math.max(0, angkaAman(ambilKolom(row, ['DURATION', 'Duration ( Hrs )', 'Duration', 'Downtime', 'Durasi']))),
              durasiStr: `${angkaAman(ambilKolom(row, ['DURATION', 'Duration ( Hrs )', 'Duration', 'Downtime', 'Durasi'])).toFixed(1)} Jam`,
              task: String(ambilKolom(row, ['TASK', 'Subsystem', 'SYSTEM', 'Sistem']) || 'OTHER SYSTEM'),
              status: String(ambilKolom(row, ['STATUS', 'Status']) || 'OPEN'),
              dateSource: actualStart ? 'Actual Start' : 'Default Modal'
            };

            if (isWorkOrderCancelled(row, normalisasiNamaKolom)) {
              dataBulan.cancelledWorkOrders.push(woObject);
              return;
            }

            const signature = `${woNum}|${asset}|${parsedDate}`.toUpperCase();
            if (woDilihat.has(signature)) return;
            woDilihat.add(signature);

            dataBulan.workOrders.push(woObject);
            dataBulan.downtime += woObject.durasiNum;
            dataBulan.dtPerCC[asset] = (dataBulan.dtPerCC[asset] || 0) + woObject.durasiNum;

            if (/breakdown|bd\b|corrective/i.test(workType)) {
              dataBulan.bd++;
              dataBulan.bdPerCC[asset] = (dataBulan.bdPerCC[asset] || 0) + 1;
              if (!dataBulan.bdDailyPerCC[asset]) dataBulan.bdDailyPerCC[asset] = new Array(31).fill(0);
              dataBulan.bdDailyPerCC[asset][dayIdx] = (dataBulan.bdDailyPerCC[asset][dayIdx] || 0) + 1;
            }
          });
        }

        // 2. PARSER PRODUKSI (TERISOLASI)
        if (cleanSheet.includes('summary daily performance') || cleanSheet.includes('produksi')) {
          const sheet = workbook.Sheets[sheetName];
          const rawGrid = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          let boxesHeaderIdx = -1;
          for (let r = 0; r < rawGrid.length; r++) {
            const rowStr = String(rawGrid[r] || '').toLowerCase();
            if (rowStr.includes('boxes') || rowStr.includes('produksi')) {
              boxesHeaderIdx = r;
              break;
            }
          }

          if (boxesHeaderIdx !== -1) {
            for (let r = boxesHeaderIdx + 1; r < Math.min(rawGrid.length, boxesHeaderIdx + 20); r++) {
              const row = rawGrid[r];
              if (!row || !row[0]) continue;

              const rowLabel = String(row[0]).trim().toUpperCase();
              if (rowLabel.includes('TOTAL') || rowLabel.includes('TOT')) break;

              const unit = normalizeUnitAsset(row[0]);
              if (unit) {
                let totalBoxUnit = 0;
                let maxDaysInRow = Math.min(30, row.length - 2);

                for (let day = 1; day <= maxDaysInRow; day++) {
                  let val = angkaAman(row[day]);
                  if (val > 0) {
                    totalBoxUnit += val;
                    dataBulan.boxesDailyPerCC[unit][day - 1] = (dataBulan.boxesDailyPerCC[unit][day - 1] || 0) + val;
                  }
                }

                if (totalBoxUnit === 0 && row[31] !== undefined && row[31] !== null && angkaAman(row[31]) > 0) {
                  totalBoxUnit = angkaAman(row[31]);
                }

                dataBulan.boxesPerCC[unit] = totalBoxUnit;
                dataBulan.boxes += totalBoxUnit;
              }
            }
          }
        }
      });

      if (dataBulan.workOrders.length === 0 && dataBulan.boxes === 0) {
        alert('Gagal! Tidak ada data valid yang dapat dibaca dari file ini.');
        return;
      }

      dataBulan.mmbf = dataBulan.bd > 0 ? Math.round(dataBulan.boxes / dataBulan.bd) : dataBulan.boxes;
      uploadedDataStore[targetKey] = dataBulan;

      saveStore();
      closeUploadModal();

      document.getElementById('filterYear').value = yearSel;
      document.getElementById('filterMonth').value = monthSel;

      renderUI();
      renderFileArchiveTable();
      showToast(`Data ${monthSel} ${yearSel} berhasil dimuat! Produksi: ${dataBulan.boxes.toLocaleString('id-ID')} Box | BD: ${dataBulan.bd}`);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses file Excel: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function resetData() {
  if (confirm('APAKAH ANDA YAKIN?\nSeluruh data arsip operasional dan grafik akan dihapus secara permanen.')) {
    localStorage.removeItem('tps_uploaded_store_v26');
    uploadedDataStore = {};
    renderUI();
    renderFileArchiveTable();
    showToast('Database berhasil di-reset!');
    setTimeout(() => location.reload(), 800);
  }
}

// OPSI HAPUS SINGLE WORK ORDER HARIAN
function deleteSingleWorkOrder(tahun, bulan, woNum, asset) {
  let key = `${tahun}-${bulan}`;
  let dataM = uploadedDataStore[key];
  if (!dataM || !dataM.workOrders) return;

  if (confirm(`Hapus Work Order [${woNum}] untuk Unit ${asset}?`)) {
    const targetIdx = dataM.workOrders.findIndex(w => w.woNum === woNum && w.asset === asset);
    if (targetIdx !== -1) {
      const removedWo = dataM.workOrders.splice(targetIdx, 1)[0];

      if (/breakdown|bd\b|corrective/i.test(removedWo.type)) {
        dataM.bd = Math.max(0, dataM.bd - 1);
        dataM.bdPerCC[asset] = Math.max(0, (dataM.bdPerCC[asset] || 1) - 1);
      }
      dataM.downtime = Math.max(0, dataM.downtime - (removedWo.durasiNum || 0));
      dataM.dtPerCC[asset] = Math.max(0, (dataM.dtPerCC[asset] || 0) - (removedWo.durasiNum || 0));
      dataM.mmbf = dataM.bd > 0 ? Math.round(dataM.boxes / dataM.bd) : dataM.boxes;

      saveStore();
      renderUI();
      renderFileArchiveTable();
      showToast(`Work Order ${woNum} berhasil dihapus.`);
    }
  }
}

function applyGlobalFilter() {
  const sMonth = document.getElementById('filterMonth').value;
  const sYear = document.getElementById('filterYear').value;
  const sCrane = document.getElementById('filterCrane').value;
  const singleDate = document.getElementById('filterSingleDate').value;

  if (!hasAnyData()) { renderCharts(); return; }

  let tBox = 0, tBd = 0, tDt = 0;
  let activeWO = [];
  let indText = "";
  let activeUnitSet = new Set();

  for (let k in uploadedDataStore) {
    let d = uploadedDataStore[k];
    const matchYear = (sYear === 'ALL' || d.year === String(sYear));
    const matchMonth = (sMonth === 'ALL' || d.month === sMonth);

    if (matchYear && matchMonth) {
      for (let u of VALID_TPS_UNITS) {
        if ((d.boxesPerCC && d.boxesPerCC[u] > 0) || (d.bdPerCC && d.bdPerCC[u] > 0)) {
          activeUnitSet.add(u);
        }
      }
      if (sCrane === 'ALL') {
        tBox += d.boxes || 0;
        tBd += d.bd || 0;
        tDt += d.downtime || 0;
      } else {
        let targetUnit = sCrane.toUpperCase().trim();
        tBox += (d.boxesPerCC && d.boxesPerCC[targetUnit]) || 0;
        tBd += (d.bdPerCC && d.bdPerCC[targetUnit]) || 0;
        tDt += (d.dtPerCC && d.dtPerCC[targetUnit]) || 0;
      }
      if (d.workOrders) {
        activeWO = activeWO.concat(d.workOrders);
      }
    }
  }

  let activeCCArray = Array.from(activeUnitSet).sort();
  let displayUnitCount = activeCCArray.length;

  if (sCrane !== 'ALL') {
    let targetUnit = sCrane.toUpperCase().trim();
    activeWO = activeWO.filter(w => normalizeUnitAsset(w.asset) === targetUnit);
    displayUnitCount = 1;
    indText = `Filter: ${sYear === 'ALL' ? 'Semua Tahun' : 'Tahun ' + sYear} (${sMonth}) | Unit: ${targetUnit}`;
  } else {
    indText = `Arsip Data: ${sYear === 'ALL' ? 'Semua Tahun' : 'Tahun ' + sYear} (${sMonth === 'ALL' ? 'Semua Bulan' : sMonth})`;
  }

  if (singleDate) {
    activeWO = activeWO.filter(w => w.tanggal === singleDate);
    tBd = activeWO.length;
    tDt = activeWO.reduce((sum, w) => sum + (w.durasiNum || 0), 0);
    indText += ` | Tgl: ${singleDate}`;
  }

  let tMmbf = tBd > 0 ? Math.round(tBox / tBd) : tBox;

  document.getElementById('activeFileIndicator').innerText = indText;
  document.getElementById('cardTotalCrane').innerText = displayUnitCount;
  document.getElementById('cardTotalBoxes').innerText = tBox > 0 ? tBox.toLocaleString('id-ID') : "0";
  document.getElementById('cardTotalBD').innerText = tBd > 0 ? tBd.toLocaleString('id-ID') : "0";
  document.getElementById('cardTotalMmbf').innerText = tMmbf > 0 ? tMmbf.toLocaleString('id-ID') : "0";
  document.getElementById('cardTotalDowntime').innerText = tDt > 0 ? tDt.toFixed(1) + " Jam" : "0 Jam";

  renderUnitMasterTable(activeCCArray);
  document.getElementById('woTableBody').innerHTML = activeWO.length ?
    activeWO.map((w, idx) => `
      <tr class="border-b hover:bg-slate-50 text-[11px] md:text-xs bg-white">
        <td class="p-3 text-center font-mono font-semibold">${idx + 1}</td>
        <td class="p-3 font-mono text-slate-700 whitespace-nowrap">${w.tanggal}</td>
        <td class="p-3 font-bold text-primary font-mono whitespace-nowrap">${w.woNum}</td>
        <td class="p-3 text-slate-700 max-w-[200px] md:max-w-xs whitespace-normal break-words">${w.desc}</td>
        <td class="p-3"><span class="${w.type.toLowerCase().includes('breakdown') ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">${w.type}</span></td>
        <td class="p-3 font-bold whitespace-nowrap">${w.asset}</td>
        <td class="p-3 font-mono whitespace-nowrap">${w.durasiStr}</td>
        <td class="p-3 text-slate-600 font-semibold text-[10px] whitespace-nowrap">${w.task}</td>
        <td class="p-3 text-center">
          <button onclick="deleteSingleWorkOrder('${w.tanggal.split('-')[0]}', '${getIndonesianMonthName(w.tanggal.split('-')[1])}', '${w.woNum}', '${w.asset}')" 
            title="Hapus Work Order ${w.woNum}" 
            class="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 w-7 h-7 rounded-lg inline-flex items-center justify-center transition shadow-sm">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="9" class="p-6 text-center text-slate-400">- Belum Ada Data Work Order -</td></tr>`;

  renderCharts(sYear, sMonth, activeWO, activeCCArray);
}

function getIndonesianMonthName(monthDigitStr) {
  const m = parseInt(monthDigitStr, 10);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return months[m - 1] || 'Januari';
}

function renderUnitMasterTable(activeCCArray) {
  const tb = document.getElementById('unitTableBody');
  if (!tb) return;
  tb.innerHTML = VALID_TPS_UNITS.map(u => {
    let isActive = activeCCArray.includes(u);
    return `<tr class="border-b ${isActive ? '' : 'opacity-40'}"><td class="p-3 font-bold text-primary">${u}</td><td class="p-3 text-slate-700">Container Crane Unit ${u}</td><td class="p-3"><span class="${isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'}">${isActive ? 'Data Ditemukan' : 'Kosong'}</span></td></tr>`;
  }).join('');
}

function calculateCustomMax(maxVal, stepSize) {
  if (!maxVal || maxVal <= 0) return stepSize * 4;
  return Math.ceil(maxVal / stepSize) * stepSize;
}

function renderCharts(sYear = 'ALL', sMonth = 'ALL', activeWO = [], activeCCArray = VALID_TPS_UNITS) {
  const subEl = document.getElementById('chartSubtitle');
  if (subEl) subEl.innerText = `${sYear === 'ALL' ? 'Semua Tahun' : 'Tahun ' + sYear} (${sMonth === 'ALL' ? 'Semua Bulan' : sMonth})`;
  let chartLabels = []; let chartBox = []; let chartBd = []; let chartMmbf = [];

  if (sMonth === 'ALL') {
    chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    chartBox = new Array(12).fill(0); chartBd = new Array(12).fill(0); chartMmbf = new Array(12).fill(0);
    const mNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    for (let k in uploadedDataStore) {
      let item = uploadedDataStore[k];
      if (sYear === 'ALL' || item.year === String(sYear)) {
        let idx = mNames.indexOf(item.month);
        if (idx !== -1) {
          activeCCArray.forEach(u => { chartBox[idx] += (item.boxesPerCC && item.boxesPerCC[u]) || 0; chartBd[idx] += (item.bdPerCC && item.bdPerCC[u]) || 0; });
          chartMmbf[idx] = chartBd[idx] > 0 ? Math.round(chartBox[idx] / chartBd[idx]) : chartBox[idx];
        }
      }
    }
  } else {
    let maxDaysInMonth = 31;
    if (['April', 'Juni', 'September', 'November'].includes(sMonth)) maxDaysInMonth = 30;
    else if (sMonth === 'Februari') maxDaysInMonth = 29;

    chartLabels = Array.from({ length: maxDaysInMonth }, (_, i) => String(i + 1));
    chartBox = new Array(maxDaysInMonth).fill(0); chartBd = new Array(maxDaysInMonth).fill(0); chartMmbf = new Array(maxDaysInMonth).fill(0);

    for (let k in uploadedDataStore) {
      let item = uploadedDataStore[k];
      if ((sYear === 'ALL' || item.year === String(sYear)) && item.month === sMonth) {
        for (let i = 0; i < maxDaysInMonth; i++) {
          let sumBox = 0; let sumBd = 0;
          activeCCArray.forEach(u => {
            if (item.boxesDailyPerCC && item.boxesDailyPerCC[u]) sumBox += item.boxesDailyPerCC[u][i] || 0;
            if (item.bdDailyPerCC && item.bdDailyPerCC[u]) sumBd += item.bdDailyPerCC[u][i] || 0;
          });
          chartBox[i] += sumBox; chartBd[i] += sumBd;
          chartMmbf[i] = chartBd[i] > 0 ? Math.round(chartBox[i] / chartBd[i]) : chartBox[i];
        }
      }
    }
  }

  const ctxMain = document.getElementById('mainTrendChart');
  if (ctxMain) {
    if (window.myChartInstance) window.myChartInstance.destroy();
    let maxBdVal = Math.max(...chartBd, 20); let maxMmbfVal = Math.max(...chartMmbf, 500);
    let bdMaxScaled = calculateCustomMax(maxBdVal, maxBdVal < 20 ? 5 : 50); let mmbfMaxScaled = calculateCustomMax(maxMmbfVal, 500);
    window.myChartInstance = new Chart(ctxMain.getContext('2d'), {
      type: 'line', data: {
        labels: chartLabels, datasets: [
          { label: 'Produksi', data: chartBox, borderColor: '#0284c7', backgroundColor: 'rgba(2,132,199,0.1)', fill: true, yAxisID: 'y', tension: 0, borderWidth: 2, pointRadius: 3 },
          { label: 'Breakdown', data: chartBd, borderColor: '#f97316', backgroundColor: 'transparent', yAxisID: 'y1', tension: 0, borderWidth: 2, pointRadius: 3 },
          { label: 'MMBF', data: chartMmbf, borderColor: '#10b981', backgroundColor: 'transparent', yAxisID: 'y2', tension: 0, borderWidth: 2, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        scales: {
          y: { type: 'linear', display: true, position: 'left', beginAtZero: true, title: { display: false }, ticks: { color: '#0284c7', font: { size: 10 } } },
          y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: bdMaxScaled, grid: { drawOnChartArea: false }, title: { display: false }, ticks: { color: '#f97316', stepSize: bdMaxScaled / 5, font: { size: 10 } } },
          y2: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: mmbfMaxScaled, grid: { drawOnChartArea: false }, title: { display: false }, ticks: { color: '#10b981', stepSize: mmbfMaxScaled / 5, font: { size: 10 } } }
        }
      }
    });
  }

  let unitBoxesMap = {}; let unitBdCountMap = {}; let unitTimeOpMap = {}; let subsystemCountMap = {};
  VALID_TPS_UNITS.forEach(u => { unitBoxesMap[u] = 0; unitBdCountMap[u] = 0; unitTimeOpMap[u] = 0; });
  for (let k in uploadedDataStore) {
    let d = uploadedDataStore[k];
    if ((sYear === 'ALL' || d.year === String(sYear)) && (sMonth === 'ALL' || d.month === sMonth)) {
      activeCCArray.forEach(u => {
        unitBoxesMap[u] += (d.boxesPerCC && d.boxesPerCC[u]) || 0; unitTimeOpMap[u] += (d.timeOpPerCC && d.timeOpPerCC[u]) || 0; unitBdCountMap[u] += (d.bdPerCC && d.bdPerCC[u]) || 0;
      });
    }
  }
  activeWO.forEach(w => { let sys = w.task || 'OTHER SYSTEM'; subsystemCountMap[sys] = (subsystemCountMap[sys] || 0) + 1; });

  let ccBoxes = activeCCArray.map(u => unitBoxesMap[u] || 0);
  let ccMtbf = activeCCArray.map(u => unitBdCountMap[u] > 0 ? parseFloat((unitTimeOpMap[u] / unitBdCountMap[u]).toFixed(2)) : parseFloat((unitTimeOpMap[u] || 0).toFixed(2)));
  let ccMmbf = activeCCArray.map(u => unitBdCountMap[u] > 0 ? Math.round(unitBoxesMap[u] / unitBdCountMap[u]) : (unitBoxesMap[u] || 0));

  if (document.getElementById('gridBarBoxes')) {
    if (window.myGB1) window.myGB1.destroy();
    window.myGB1 = new Chart(document.getElementById('gridBarBoxes').getContext('2d'), { type: 'bar', data: { labels: activeCCArray, datasets: [{ label: 'Produksi', data: ccBoxes, backgroundColor: '#0284c7', borderRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { beginAtZero: true, ticks: { font: { size: 9 } } } } } });
  }
  if (document.getElementById('gridBarTimeOp')) {
    if (window.myGB2) window.myGB2.destroy();
    window.myGB2 = new Chart(document.getElementById('gridBarTimeOp').getContext('2d'), { type: 'bar', data: { labels: activeCCArray, datasets: [{ label: 'MTBF', data: ccMtbf, backgroundColor: '#0f766e', borderRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { beginAtZero: true, ticks: { font: { size: 9 } } } } } });
  }
  if (document.getElementById('gridBarMmbf')) {
    if (window.myGB3) window.myGB3.destroy();
    window.myGB3 = new Chart(document.getElementById('gridBarMmbf').getContext('2d'), { type: 'bar', data: { labels: activeCCArray, datasets: [{ label: 'MMBF', data: ccMmbf, backgroundColor: '#4338ca', borderRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { beginAtZero: true, ticks: { font: { size: 9 } } } } } });
  }
  if (document.getElementById('gridPieBig6')) {
    if (window.myGP) window.myGP.destroy();
    let big6Labels = Object.keys(subsystemCountMap); let big6Data = Object.values(subsystemCountMap);
    if (big6Labels.length === 0) { big6Labels = ['0 Data/Tidak Ada WO']; big6Data = [1]; }
    const donutColors = { 'SPREADER SYSTEM': '#0284c7', 'TROLLEY SYSTEM': '#0ea5e9', 'GANTRY SYSTEM': '#64748b', 'TRIM LIST SKEW SYSTEM': '#eab308', 'HOIST SYSTEM': '#4f46e5', 'ELECTRIC CONTROL SYSTEM': '#10b981', 'OTHER SYSTEM': '#475569', '0 Data/Tidak Ada WO': '#e2e8f0' };
    const mappedColors = big6Labels.map(l => donutColors[l] || '#94a3b8');
    window.myGP = new Chart(document.getElementById('gridPieBig6').getContext('2d'), { type: 'doughnut', data: { labels: big6Labels, datasets: [{ data: big6Data, backgroundColor: mappedColors, borderWidth: 1, borderColor: '#ffffff' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } } });
  }
}

function renderFileArchiveTable() {
  const container = document.getElementById('archiveDrillContainer');
  const backBtn = document.getElementById('archiveBackBtn');
  const breadcrumb = document.getElementById('archiveBreadcrumb');
  if (!container) return;

  if (archiveCurrentLevel === 'YEAR') {
    if (backBtn) backBtn.classList.add('hidden');
    if (breadcrumb) breadcrumb.innerHTML = `Pilih Tahun untuk melihat rincian bulan. Ikon <i class="fa-solid fa-download text-primary mx-1"></i> untuk Unduh, Ikon <i class="fa-solid fa-trash-can text-rose-500 mx-1"></i> untuk Hapus.`;

    const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        ${years.map(yr => {
      let totalWoYr = 0; let totalBoxYr = 0;
      for (let k in uploadedDataStore) {
        if (uploadedDataStore[k].year === yr) {
          totalWoYr += uploadedDataStore[k].workOrders ? uploadedDataStore[k].workOrders.length : 0;
          totalBoxYr += uploadedDataStore[k].boxes || 0;
        }
      }
      let hasData = totalWoYr > 0 || totalBoxYr > 0;

      return `
            <div onclick="drillToMonth('${yr}')" 
              class="bg-white rounded-2xl border ${hasData ? 'border-primary/30 hover:border-primary shadow-sm hover:shadow-md' : 'border-slate-200 opacity-60'} p-4 sm:p-5 cursor-pointer transition relative group flex flex-col justify-between h-40 sm:h-44">
              
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider block mb-1">Arsip Tahunan</span>
                  <h3 class="text-2xl sm:text-3xl font-black text-slate-800 font-mono">${yr}</h3>
                </div>
                <div class="flex items-center gap-1.5">
                  <button onclick="event.stopPropagation(); exportWorkOrdersExcel('${yr}', '')" title="Unduh Rekap Tahun ${yr}"
                    class="bg-sky-100 hover:bg-primary hover:text-white text-primary w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm">
                    <i class="fa-solid fa-download text-xs"></i>
                  </button>
                  ${hasData ? `
                  <button onclick="event.stopPropagation(); deleteArchiveData('${yr}', '')" title="Hapus Data Tahun ${yr}"
                    class="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>` : ''}
                </div>
              </div>

              <div class="space-y-1 pt-3 border-t border-slate-100">
                <div class="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Total WO:</span>
                  <span class="font-mono text-slate-900">${totalWoYr} WO</span>
                </div>
                <div class="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Produksi:</span>
                  <span class="font-mono text-emerald-600">${totalBoxYr.toLocaleString('id-ID')} Box</span>
                </div>
              </div>

            </div>
          `;
    }).join('')}
      </div>
    `;

  } else if (archiveCurrentLevel === 'MONTH') {
    if (backBtn) backBtn.classList.remove('hidden');
    if (breadcrumb) breadcrumb.innerHTML = `<span class="font-bold text-primary">Tahun ${archiveSelectedYear}</span> $\rightarrow$ Pilih Bulan untuk detail harian.`;

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    container.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        ${months.map(m => {
      let key = `${archiveSelectedYear}-${m}`;
      let dataM = uploadedDataStore[key];
      let woCount = dataM && dataM.workOrders ? dataM.workOrders.length : 0;
      let boxCount = dataM ? (dataM.boxes || 0) : 0;
      let hasData = woCount > 0 || boxCount > 0;

      return `
            <div onclick="drillToDaily('${archiveSelectedYear}', '${m}')"
              class="bg-white rounded-xl border ${hasData ? 'border-teal-400/40 hover:border-teal-500 shadow-sm hover:shadow-md' : 'border-slate-200 opacity-60'} p-3.5 sm:p-4 cursor-pointer transition relative group flex flex-col justify-between h-36">
              
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">${archiveSelectedYear}</span>
                  <h4 class="text-base sm:text-lg font-bold text-slate-800">${m}</h4>
                </div>
                <div class="flex items-center gap-1">
                  <button onclick="event.stopPropagation(); exportWorkOrdersExcel('${archiveSelectedYear}', '${m}')" title="Unduh Rekap ${m} ${archiveSelectedYear}"
                    class="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 w-7 h-7 rounded-lg flex items-center justify-center transition shadow-sm">
                    <i class="fa-solid fa-download text-xs"></i>
                  </button>
                  ${hasData ? `
                  <button onclick="event.stopPropagation(); deleteArchiveData('${archiveSelectedYear}', '${m}')" title="Hapus Data ${m} ${archiveSelectedYear}"
                    class="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 w-7 h-7 rounded-lg flex items-center justify-center transition shadow-sm">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>` : ''}
                </div>
              </div>

              <div class="space-y-0.5 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px]">
                <div class="flex justify-between text-slate-600">
                  <span>WO Maintenance:</span>
                  <span class="font-mono font-bold text-slate-900">${woCount} WO</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Produksi:</span>
                  <span class="font-mono font-bold text-emerald-600">${boxCount.toLocaleString('id-ID')} Box</span>
                </div>
              </div>

            </div>
          `;
    }).join('')}
      </div>
    `;

  } else if (archiveCurrentLevel === 'DAILY') {
    if (backBtn) backBtn.classList.remove('hidden');
    if (breadcrumb) breadcrumb.innerHTML = `<span class="font-bold text-primary">Tahun ${archiveSelectedYear}</span> $\rightarrow$ <span class="font-bold text-emerald-600">${archiveSelectedMonth}</span> $\rightarrow$ Rincian Data Harian & Work Order`;

    let key = `${archiveSelectedYear}-${archiveSelectedMonth}`;
    let dataM = uploadedDataStore[key];
    let woList = dataM && dataM.workOrders ? dataM.workOrders : [];

    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-3 sm:p-4 bg-slate-50 border-b flex justify-between items-center flex-wrap gap-2">
          <h3 class="font-bold text-slate-800 text-xs sm:text-sm md:text-base">Daftar Work Order Harian - ${archiveSelectedMonth} ${archiveSelectedYear}</h3>
          <span class="text-[11px] sm:text-xs bg-sky-100 text-primary font-bold px-3 py-1 rounded-full">${woList.length} Total WO</span>
        </div>
        <div class="max-h-[60vh] overflow-y-auto overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs md:text-sm min-w-[750px]">
            <thead>
              <tr class="bg-slate-100 text-slate-700 border-b sticky top-0 font-bold text-[11px] sm:text-xs">
                <th class="p-3 text-center w-10">No</th>
                <th class="p-3">Tanggal</th>
                <th class="p-3">No. Work Order</th>
                <th class="p-3">Keterangan / Kendala</th>
                <th class="p-3">Work Type</th>
                <th class="p-3">Asset</th>
                <th class="p-3">Durasi</th>
                <th class="p-3">Subsystem</th>
                <th class="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              ${woList.length > 0 ? woList.map((w, idx) => `
                <tr class="hover:bg-slate-50 text-[11px] sm:text-xs">
                  <td class="p-3 text-center font-mono font-semibold">${idx + 1}</td>
                  <td class="p-3 font-mono text-slate-700 whitespace-nowrap">${w.tanggal}</td>
                  <td class="p-3 font-bold text-primary font-mono whitespace-nowrap">${w.woNum}</td>
                  <td class="p-3 text-slate-700 max-w-[200px] sm:max-w-xs whitespace-normal break-words">${w.desc}</td>
                  <td class="p-3"><span class="${w.type.toLowerCase().includes('breakdown') ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">${w.type}</span></td>
                  <td class="p-3 font-bold whitespace-nowrap">${w.asset}</td>
                  <td class="p-3 font-mono whitespace-nowrap">${w.durasiStr}</td>
                  <td class="p-3 text-slate-600 font-semibold text-[10px] whitespace-nowrap">${w.task}</td>
                  <td class="p-3 text-center">
                    <button onclick="deleteSingleWorkOrder('${archiveSelectedYear}', '${archiveSelectedMonth}', '${w.woNum}', '${w.asset}')" 
                      title="Hapus Work Order ${w.woNum}" 
                      class="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 w-7 h-7 rounded-lg inline-flex items-center justify-center transition shadow-sm">
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="9" class="p-6 text-center text-slate-400">Tidak ada rincian Work Order di bulan ${archiveSelectedMonth} ${archiveSelectedYear}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

function deleteArchiveData(tahun, bulan = '') {
  const targetLabel = bulan ? `${bulan} ${tahun}` : `Tahun ${tahun}`;
  if (confirm(`KONFIRMASI HAPUS DATA:\nApakah Anda yakin ingin menghapus seluruh data pada ${targetLabel}?`)) {
    for (let k in uploadedDataStore) {
      const d = uploadedDataStore[k];
      const matchYear = d.year === String(tahun);
      const matchMonth = !bulan || d.month === bulan;

      if (matchYear && matchMonth) {
        delete uploadedDataStore[k];
      }
    }
    saveStore();
    renderUI();
    renderFileArchiveTable();
    showToast(`Data ${targetLabel} berhasil dihapus.`);
  }
}

function drillToMonth(year) {
  archiveCurrentLevel = 'MONTH';
  archiveSelectedYear = year;
  renderFileArchiveTable();
}

function drillToDaily(year, month) {
  archiveCurrentLevel = 'DAILY';
  archiveSelectedYear = year;
  archiveSelectedMonth = month;
  renderFileArchiveTable();
}

function navigateArchiveBack() {
  if (archiveCurrentLevel === 'DAILY') {
    archiveCurrentLevel = 'MONTH';
  } else if (archiveCurrentLevel === 'MONTH') {
    archiveCurrentLevel = 'YEAR';
    archiveSelectedYear = null;
    archiveSelectedMonth = null;
  }
  renderFileArchiveTable();
}

function exportWorkOrdersExcel(tahun = '', bulan = '') {
  let filteredWOs = [];

  for (let k in uploadedDataStore) {
    const d = uploadedDataStore[k];
    const matchYear = !tahun || d.year === String(tahun);
    const matchMonth = !bulan || d.month === bulan;

    if (matchYear && matchMonth && d.workOrders) {
      filteredWOs = filteredWOs.concat(d.workOrders);
    }
  }

  if (filteredWOs.length === 0) {
    alert(`Tidak ada data Work Order untuk diekspor pada filter: ${tahun || 'Semua Tahun'} ${bulan || ''}`);
    return;
  }

  const exportData = filteredWOs.map((w, index) => ({
    'No': index + 1,
    'No. Work Order': w.woNum || '-',
    'Asset / Unit CC': w.asset || '-',
    'Work Type': w.type || '-',
    'Sistem (Big 6)': w.task || '-',
    'Keterangan / Masalah': w.desc || '-',
    'Tanggal': w.tanggal || '-',
    'Sumber Tanggal': w.dateSource || 'Actual',
    'Durasi Downtime (Jam)': Number(w.durasiNum || 0),
    'Status': w.status || 'COMPLETED'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
    { wch: 22 },
    { wch: 40 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data WO Maintenance');

  let fileName = `Report_WO_TPS`;
  if (tahun) fileName += `_${tahun}`;
  if (bulan) fileName += `_${bulan}`;
  fileName += `.xlsx`;

  XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'binary' });
  showToast(`Berhasil mengunduh Excel: ${fileName}`);
}

function initUserChatSessions() {
  if (!allUserChatSessions[currentUsername]) allUserChatSessions[currentUsername] = [];
  let userSessions = allUserChatSessions[currentUsername];
  if (userSessions.length === 0 || !activeSessionId) {
    createNewChatSession();
  } else {
    if (!userSessions.some(s => s.id === activeSessionId)) activeSessionId = userSessions[0].id;
  }
  localStorage.setItem('tps_active_session_id', activeSessionId);
  renderChatHistorySidebar(); renderActiveChatMessages();
}

function createNewChatSession() {
  if (!allUserChatSessions[currentUsername]) allUserChatSessions[currentUsername] = [];
  let newId = 'session_' + Date.now();
  let newSession = {
    id: newId, title: 'Percakapan Baru',
    messages: [{ sender: 'ai', text: `Halo rekan **${currentUsername}**, silakan tanyakan kendala teknis atau informasi perbaikan operasional Container Crane PT TPS.` }]
  };
  allUserChatSessions[currentUsername].unshift(newSession);
  activeSessionId = newId; localStorage.setItem('tps_active_session_id', activeSessionId);
  saveChatSessions(); renderChatHistorySidebar(); renderActiveChatMessages();
}

function switchChatSession(sessionId) {
  activeSessionId = sessionId; localStorage.setItem('tps_active_session_id', activeSessionId);
  renderChatHistorySidebar(); renderActiveChatMessages();
}

function deleteChatSession(sessionId, event) {
  event.stopPropagation();
  if (!confirm('Hapus sesi riwayat chat ini?')) return;
  let userSessions = allUserChatSessions[currentUsername];
  allUserChatSessions[currentUsername] = userSessions.filter(s => s.id !== sessionId);
  if (allUserChatSessions[currentUsername].length === 0) createNewChatSession();
  else if (activeSessionId === sessionId) activeSessionId = allUserChatSessions[currentUsername][0].id;
  saveChatSessions(); renderChatHistorySidebar(); renderActiveChatMessages();
}

function renderChatHistorySidebar() {
  const listEl = document.getElementById('chatHistoryList');
  if (!listEl) return;
  let userSessions = allUserChatSessions[currentUsername] || [];
  if (userSessions.length === 0) return listEl.innerHTML = `<p class="text-slate-400 text-center py-4 text-xs">Belum ada riwayat</p>`;

  listEl.innerHTML = userSessions.map(s => `
    <div onclick="switchChatSession('${s.id}')" class="p-2 rounded-lg cursor-pointer flex justify-between items-center transition ${s.id === activeSessionId ? 'bg-primary text-white font-semibold shadow-sm' : 'hover:bg-slate-200 text-slate-700'}">
      <div class="truncate pr-2 text-[11px] md:text-xs"><i class="fa-regular fa-message mr-1.5"></i> ${s.title}</div>
      <button onclick="deleteChatSession('${s.id}', event)" class="text-slate-400 hover:text-red-300 p-1"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
    </div>
  `).join('');
}

function renderActiveChatMessages() {
  const chatBox = document.getElementById('aiChatBox');
  if (!chatBox) return;
  let userSessions = allUserChatSessions[currentUsername] || [];
  let currentSession = userSessions.find(s => s.id === activeSessionId);
  if (!currentSession) return;

  chatBox.innerHTML = currentSession.messages.map(m => {
    let formattedText = m.text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br>');

    if (m.sender === 'user') {
      return `<div class="flex items-start gap-3 justify-end"><div class="bg-primary text-white p-2.5 md:p-3 rounded-xl rounded-tr-none shadow-sm max-w-[85%]" style="word-break: break-word;">${formattedText}</div></div>`;
    } else {
      return `
        <div class="flex items-start gap-2 md:gap-3">
          <div class="bg-primary text-white p-2 rounded-full shrink-0"><i class="fa-solid fa-robot text-xs md:text-sm"></i></div>
          <div class="bg-white border text-slate-700 p-3 md:p-4 rounded-xl rounded-tl-none shadow-sm max-w-[90%] space-y-2" style="word-break: break-word; line-height: 1.6;">
            <div>${formattedText}</div>
            <div class="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 mt-2">💡 AI Expert Maintenance CC - PT TPS</div>
          </div>
      </div>`;
    }
  }).join('');
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendAiQuery() {
  const inputEl = document.getElementById('aiUserInput');
  if (!inputEl) return;
  const rawQ = inputEl.value.trim();
  if (!rawQ) return;

  let userSessions = allUserChatSessions[currentUsername];
  let currentSession = userSessions.find(s => s.id === activeSessionId);
  if (!currentSession) return;

  if (currentSession.title === 'Percakapan Baru') {
    currentSession.title = rawQ.length > 25 ? rawQ.substring(0, 25) + '...' : rawQ;
  }

  currentSession.messages.push({ sender: 'user', text: rawQ });
  saveChatSessions();
  renderChatHistorySidebar();
  renderActiveChatMessages();
  inputEl.value = "";

  currentSession.messages.push({ sender: 'ai', actionId: 'loading_ai', text: '🤖 Sedang menganalisis melalui server backend Node.js...' });
  renderActiveChatMessages();

  let aiReply = "";

  try {
    const maintenanceData = Object.entries(uploadedDataStore).flatMap(
      ([periode, data]) =>
        (data.workOrders || []).map(wo => ({
          periode,
          tanggal: wo.tanggal || '',
          woNum: wo.woNum || '',
          asset: wo.asset || '',
          type: wo.type || '',
          desc: wo.desc || '',
          task: wo.task || '',
          durasiStr: wo.durasiStr || '',
          status: wo.status || ''
        }))
    );

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      const maintenanceData = Object.entries(uploadedDataStore).flatMap(
        ([periode, data]) =>
          (data.workOrders || []).map(wo => ({
            periode,
            tanggal: wo.tanggal || '',
            woNum: wo.woNum || '',
            asset: wo.asset || '',
            type: wo.type || '',
            desc: wo.desc || '',
            task: wo.task || '',
            status: wo.status || ''
          }))
      );

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: rawQ,
          maintenanceData
        })
      });
    });

    const data = await response.json();

    if (response.ok && typeof data.answer === 'string' && data.answer.trim()) {
      aiReply = data.answer;
    } else if (
      response.ok &&
      data.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      aiReply = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      const errorMessage =
        typeof data.error === 'string'
          ? data.error
          : data.error.message || JSON.stringify(data.error);

      aiReply = `⚠️ **Error dari API Gemini:** ${errorMessage}`;
    } else {
      console.error('Respons backend tidak sesuai:', data);
      aiReply =
        `⚠️ Backend tidak mengembalikan jawaban AI. Status HTTP: ${response.status}.`;
    }
  } catch (err) {
    console.warn("Gagal terhubung ke backend lokal:", err);
    aiReply = "⚠️ **Gagal terhubung ke server lokal (`http://localhost:3000`).** Pastikan Anda menjalankan perintah `node server.js` di terminal!";
  }

  currentSession.messages = currentSession.messages.filter(m => m.actionId !== 'loading_ai');
  currentSession.messages.push({ sender: 'ai', text: aiReply });
  saveChatSessions();
  renderChatHistorySidebar();
  renderActiveChatMessages();
}

window.onload = function () {
  updateClock();
  if (currentUserRole) {
    document.getElementById('loginModal').classList.add('hidden');
    applyRolePermissions();
    initUserChatSessions();
  } else {
    document.getElementById('loginModal').classList.remove('hidden');
  }
  renderUI();
};