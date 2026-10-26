// ==========================================
// KODE KESELURUHAN SCRIPT.JS - AI MAINTENANCE CC PT TPS
// ==========================================

const AUTH_CONFIG = { adminPassword: 'admin123', teknisiPassword: 'teknisi123' };
const VALID_TPS_UNITS = ['CC01', 'CC02', 'CC03', 'CC04', 'CC06', 'CC08', 'CC09', 'CC10', 'CC14', 'CC15', 'CC16', 'CC21', 'CC22', 'CC23', 'CC24', 'CC25'];

let uploadedDataStore = JSON.parse(localStorage.getItem('tps_uploaded_store_v24') || '{}');
let currentUserRole = localStorage.getItem('tps_current_role') || null;
let currentUsername = localStorage.getItem('tps_current_username') || "Teknisi_TPS";

let allUserChatSessions = JSON.parse(localStorage.getItem('tps_chat_sessions_v3') || '{}');
let activeSessionId = localStorage.getItem('tps_active_session_id') || null;

// API Key kosong secara default untuk keamanan GitHub (bisa diisi via input UI atau backend)
let userCustomApiKey = localStorage.getItem('tps_custom_gemini_api_key') || "";

function saveStore() { localStorage.setItem('tps_uploaded_store_v24', JSON.stringify(uploadedDataStore)); }
function saveChatSessions() { localStorage.setItem('tps_chat_sessions_v3', JSON.stringify(allUserChatSessions)); }

function saveCustomApiKey() {
  const keyVal = document.getElementById('customApiKeyInput').value.trim();
  userCustomApiKey = keyVal;
  localStorage.setItem('tps_custom_gemini_api_key', keyVal);
  showToast("API Key Gemini berhasil disimpan!");
}

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
    if (roleDescEl) roleDescEl.innerText = "Administrator";
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
    const keyField = document.getElementById('customApiKeyInput');
    if (keyField) keyField.value = userCustomApiKey;
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
    document.getElementById('woTableBody').innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">- Belum Ada Data Aktual -</td></tr>`;
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
  document.getElementById('toastMessage').innerText = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

function normalizeUnitAsset(rawAsset) {
  if (!rawAsset) return null;
  let str = String(rawAsset).toUpperCase().trim();
  for (let u of VALID_TPS_UNITS) { if (str.includes(u) || str.includes(u.replace('CC', 'QC'))) return u; }
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
  const boxes = parseFloat(document.getElementById('manBoxes').value) || 0;

  let key = `${year}-${monthName}`;
  if (!uploadedDataStore[key]) {
    uploadedDataStore[key] = {
      fileName: `Manual Input (${monthName} ${year})`, month: monthName, year: year, units: [crane],
      totalCC: 1, boxes: 0, bd: 0, mmbf: 0, downtime: 0, workOrders: [],
      boxesPerCC: {}, timeOpPerCC: {}, bdPerCC: {}, dtPerCC: {},
      boxesDailyPerCC: {}, timeOpDailyPerCC: {}, bdDailyPerCC: {}
    };
    VALID_TPS_UNITS.forEach(u => {
      uploadedDataStore[key].boxesPerCC[u] = 0; uploadedDataStore[key].timeOpPerCC[u] = 0; uploadedDataStore[key].bdPerCC[u] = 0; uploadedDataStore[key].dtPerCC[u] = 0;
      uploadedDataStore[key].boxesDailyPerCC[u] = new Array(31).fill(0); uploadedDataStore[key].timeOpDailyPerCC[u] = new Array(31).fill(0); uploadedDataStore[key].bdDailyPerCC[u] = new Array(31).fill(0);
    });
  }

  let ds = uploadedDataStore[key];
  ds.boxes += boxes; ds.bd += 1; ds.downtime += downtime;
  ds.mmbf = Math.round(ds.boxes / (ds.bd || 1));
  if (!ds.units.includes(crane)) ds.units.push(crane);

  ds.boxesPerCC[crane] += boxes; ds.bdPerCC[crane] += 1; ds.dtPerCC[crane] += downtime;
  ds.boxesDailyPerCC[crane][dayIdx] += boxes; ds.bdDailyPerCC[crane][dayIdx] += 1;

  ds.workOrders.push({
    tanggal: parseValidDate(date, year), woNum: customWoNum, desc: desc,
    type: "Breakdown", asset: crane, durasiStr: downtime + " Jam", durasiNum: downtime, task: subsystem
  });

  saveStore(); closeManualModal(); renderUI();
  showToast('Data manual berhasil disimpan ke database global!');
}

function processUploadedFile() {
  const fileInput = document.getElementById('actualFileInput');
  const yearSel = document.getElementById('uploadYear').value;
  const monthSel = document.getElementById('uploadMonth').value;

  if (fileInput.files.length === 0) return alert('Pilih berkas Excel terlebih dahulu!');

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });

      let boxesPerCC = {}; let timeOpPerCC = {}; let bdPerCC = {}; let dtPerCC = {};
      let boxesDailyPerCC = {}; let timeOpDailyPerCC = {}; let bdDailyPerCC = {};

      VALID_TPS_UNITS.forEach(u => {
        boxesPerCC[u] = 0; timeOpPerCC[u] = 0; bdPerCC[u] = 0; dtPerCC[u] = 0;
        boxesDailyPerCC[u] = new Array(31).fill(0); timeOpDailyPerCC[u] = new Array(31).fill(0); bdDailyPerCC[u] = new Array(31).fill(0);
      });

      let maxDays = 31;
      if (['April', 'Juni', 'September', 'November'].includes(monthSel)) maxDays = 30;
      else if (monthSel === 'Februari') maxDays = (parseInt(yearSel) % 4 === 0) ? 29 : 28;

      let summarySheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('summary') || n.toLowerCase().includes('performance'));

      if (summarySheetName) {
        let sumJson = XLSX.utils.sheet_to_json(workbook.Sheets[summarySheetName], { header: 1 });
        let currentSection = '';

        for (let r = 0; r < sumJson.length; r++) {
          let row = sumJson[r];
          if (!row || !row[0]) continue;
          let col0 = String(row[0]).trim().toUpperCase();

          if (col0.includes('BOXES / PRODUKSI') || col0 === 'BOXES') { currentSection = 'BOXES'; continue; }
          if (col0.includes('TIME OPERATION')) { currentSection = 'TIME'; continue; }
          if (col0.includes('NUMBER OF BREAKDOWN') || col0 === 'BREAKDOWN') { currentSection = 'BREAKDOWN'; continue; }

          if (['BOXES', 'TIME', 'BREAKDOWN'].includes(currentSection)) {
            let unitMatch = normalizeUnitAsset(col0);
            if (unitMatch && col0.length <= 6) {
              for (let c = 1; c <= maxDays; c++) {
                let val = parseFloat(row[c]);
                if (!isNaN(val)) {
                  if (currentSection === 'BOXES') { boxesPerCC[unitMatch] += val; boxesDailyPerCC[unitMatch][c - 1] += val; }
                  else if (currentSection === 'TIME') { timeOpPerCC[unitMatch] += val; timeOpDailyPerCC[unitMatch][c - 1] += val; }
                  else if (currentSection === 'BREAKDOWN') { bdPerCC[unitMatch] += val; bdDailyPerCC[unitMatch][c - 1] += val; }
                }
              }
            }
          }
        }
      }

      let totalBoxes = Object.values(boxesPerCC).reduce((a, b) => a + b, 0);
      let breakdownCount = Object.values(bdPerCC).reduce((a, b) => a + b, 0);
      let totalDowntime = 0;
      let parsedWorkOrders = [];

      let woSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('work order') || n.toLowerCase().includes('wo') || n.toLowerCase().includes('list of work orders'));
      if (woSheetName) {
        let woRawJson = XLSX.utils.sheet_to_json(workbook.Sheets[woSheetName]);
        woRawJson.forEach(row => {
          let woNum = row['Work Order'] || row['Order'] || row['WO'] || row['No WO'];
          if (woNum) {
            let desc = String(row['Description'] || row['Short Text'] || row['Problem'] || '-');
            let rawAsset = String(row['Asset'] || row['Equipment'] || row['Asset2'] || row['Unit'] || '');
            let normalizedAsset = normalizeUnitAsset(rawAsset);
            if (!normalizedAsset) return;

            let durasi = row['DURATION'] || row['Duration'] || row['Durasi'] || 0;
            let durasiNum = typeof durasi === 'number' ? durasi * 24 : parseFloat(durasi) || 0;
            totalDowntime += durasiNum; dtPerCC[normalizedAsset] += durasiNum;

            let durasiStr = typeof durasi === 'number' ? `${durasiNum.toFixed(1)} Jam` : String(durasi);
            let rawDate = row['Doc. date'] || row['DOC DATE/ SCH DATE'] || row['Date'] || `${yearSel}-01-01`;

            let sysText = (String(row['Problem Code'] || '') + " " + String(row['TASK'] || '') + " " + desc).toUpperCase();
            let taskStr = 'OTHER SYSTEM';
            if (sysText.includes('SPD') || sysText.includes('SPRE') || sysText.includes('FLIP')) taskStr = 'SPREADER SYSTEM';
            else if (sysText.includes('TRL') || sysText.includes('TROL')) taskStr = 'TROLLEY SYSTEM';
            else if (sysText.includes('GTR') || sysText.includes('GANT') || sysText.includes('TRAVEL')) taskStr = 'GANTRY SYSTEM';
            else if (sysText.includes('TLS') || sysText.includes('TRIM') || sysText.includes('SKEW') || sysText.includes('LIST')) taskStr = 'TRIM LIST SKEW SYSTEM';
            else if (sysText.includes('HST') || sysText.includes('HOIS')) taskStr = 'HOIST SYSTEM';
            else if (sysText.includes('ELC') || sysText.includes('ELEV') || sysText.includes('CAB') || sysText.includes('LIGHT') || sysText.includes('POWER')) taskStr = 'ELECTRIC CONTROL SYSTEM';

            parsedWorkOrders.push({
              tanggal: parseValidDate(rawDate, yearSel), woNum: String(woNum), desc: desc, type: String(row['Work Type'] || 'Breakdown'),
              asset: normalizedAsset, durasiStr: durasiStr, durasiNum: durasiNum, task: taskStr
            });
          }
        });
      }

      let mmbfVal = breakdownCount > 0 ? Math.round(totalBoxes / breakdownCount) : totalBoxes;

      uploadedDataStore[`${yearSel}-${monthSel}`] = {
        fileName: file.name, month: monthSel, year: yearSel, units: VALID_TPS_UNITS,
        totalCC: VALID_TPS_UNITS.length, boxes: totalBoxes, bd: breakdownCount, mmbf: mmbfVal, downtime: totalDowntime, workOrders: parsedWorkOrders,
        boxesPerCC: boxesPerCC, timeOpPerCC: timeOpPerCC, bdPerCC: bdPerCC, dtPerCC: dtPerCC,
        boxesDailyPerCC: boxesDailyPerCC, timeOpDailyPerCC: timeOpDailyPerCC, bdDailyPerCC: bdDailyPerCC
      };

      saveStore(); closeUploadModal(); renderUI();
      showToast(`Parser Sukses: Ditemukan ${totalBoxes.toLocaleString('id-ID')} Boxes di ${monthSel} ${yearSel}.`);
    } catch (err) {
      console.error(err); alert("Gagal memparsing file Excel.");
    }
  };
  reader.readAsArrayBuffer(file);
}

function verifyAdminAction(callback) {
  if (currentUserRole !== 'admin') return alert('Akses Ditolak! Fitur ini khusus Administrator.');
  let pin = prompt('Masukkan password administrator:');
  if (pin === AUTH_CONFIG.adminPassword) callback();
  else if (pin !== null) alert('Password salah!');
}

function resetData() {
  verifyAdminAction(() => {
    if (confirm('Reset seluruh database arsip?')) {
      uploadedDataStore = {}; saveStore(); renderUI(); showToast('Database berhasil di-reset.');
    }
  });
}

function deleteFileRecord(k) {
  verifyAdminAction(() => {
    if (confirm('Hapus arsip ini?')) {
      delete uploadedDataStore[k]; saveStore(); renderFileArchiveTable(); renderUI(); showToast('Arsip berhasil dihapus.');
    }
  });
}

function applyGlobalFilter() {
  const sMonth = document.getElementById('filterMonth').value;
  const sYear = document.getElementById('filterYear').value;
  const sCrane = document.getElementById('filterCrane').value;
  const singleDate = document.getElementById('filterSingleDate').value;

  if (!hasAnyData()) { renderCharts(); return; }

  let tBox = 0, tBd = 0, tDt = 0;
  let activeWO = []; let indText = "";
  let activeUnitSet = new Set();

  for (let k in uploadedDataStore) {
    let d = uploadedDataStore[k];
    if (d.year === sYear) {
      if (sMonth === 'ALL' || d.month === sMonth) {
        for (let u of VALID_TPS_UNITS) {
          if ((d.boxesPerCC && d.boxesPerCC[u] > 0) || (d.bdPerCC && d.bdPerCC[u] > 0)) activeUnitSet.add(u);
        }
        if (sCrane === 'ALL') { tBox += d.boxes || 0; tBd += d.bd || 0; tDt += d.downtime || 0; }
        else {
          let targetUnit = sCrane.toUpperCase().trim();
          tBox += (d.boxesPerCC && d.boxesPerCC[targetUnit]) || 0; tBd += (d.bdPerCC && d.bdPerCC[targetUnit]) || 0; tDt += (d.dtPerCC && d.dtPerCC[targetUnit]) || 0;
        }
        if (d.workOrders) activeWO = activeWO.concat(d.workOrders);
      }
    }
  }

  let activeCCArray = Array.from(activeUnitSet).sort();
  let displayUnitCount = activeCCArray.length;

  if (sCrane !== 'ALL') {
    let targetUnit = sCrane.toUpperCase().trim();
    activeWO = activeWO.filter(w => normalizeUnitAsset(w.asset) === targetUnit);
    displayUnitCount = 1; indText = `Tahun ${sYear} (${sMonth}) | Filter Unit: ${targetUnit}`;
  } else {
    indText = `Arsip Terpusat Tahun ${sYear} (${sMonth})`;
  }

  if (singleDate) {
    activeWO = activeWO.filter(w => w.tanggal === singleDate);
    tBd = activeWO.length; tDt = activeWO.reduce((sum, w) => sum + (w.durasiNum || 0), 0);
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
        <td class="p-3 font-mono text-slate-700">${w.tanggal}</td>
        <td class="p-3 font-bold text-primary font-mono">${w.woNum}</td>
        <td class="p-3 text-slate-700 max-w-[200px] whitespace-normal break-words">${w.desc}</td>
        <td class="p-3"><span class="${w.type.toLowerCase().includes('breakdown') ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded text-[9px] font-bold">${w.type}</span></td>
        <td class="p-3 font-bold">${w.asset}</td>
        <td class="p-3 font-mono whitespace-nowrap">${w.durasiStr}</td>
        <td class="p-3 text-slate-600 font-semibold text-[10px]">${w.task}</td>
      </tr>
    `).join('') : `<tr><td colspan="8" class="p-6 text-center text-slate-400">Tidak ada Work Order pada filter tersebut</td></tr>`;
  renderCharts(sYear, sMonth, activeWO, activeCCArray);
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

function renderCharts(sYear = '2026', sMonth = 'ALL', activeWO = [], activeCCArray = VALID_TPS_UNITS) {
  const subEl = document.getElementById('chartSubtitle');
  if (subEl) subEl.innerText = `Tahun ${sYear} (${sMonth})`;
  let chartLabels = []; let chartBox = []; let chartBd = []; let chartMmbf = [];

  if (sMonth === 'ALL') {
    chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    chartBox = new Array(12).fill(0); chartBd = new Array(12).fill(0); chartMmbf = new Array(12).fill(0);
    const mNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    for (let k in uploadedDataStore) {
      let item = uploadedDataStore[k];
      if (item.year === sYear) {
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
    else if (sMonth === 'Februari') maxDaysInMonth = (parseInt(sYear) % 4 === 0) ? 29 : 28;

    chartLabels = Array.from({ length: maxDaysInMonth }, (_, i) => String(i + 1));
    chartBox = new Array(maxDaysInMonth).fill(0); chartBd = new Array(maxDaysInMonth).fill(0); chartMmbf = new Array(maxDaysInMonth).fill(0);
    let targetD = uploadedDataStore[`${sYear}-${sMonth}`];
    if (targetD) {
      for (let i = 0; i < maxDaysInMonth; i++) {
        let sumBox = 0; let sumBd = 0;
        activeCCArray.forEach(u => {
          if (targetD.boxesDailyPerCC && targetD.boxesDailyPerCC[u]) sumBox += targetD.boxesDailyPerCC[u][i];
          if (targetD.bdDailyPerCC && targetD.bdDailyPerCC[u]) sumBd += targetD.bdDailyPerCC[u][i];
        });
        chartBox[i] = sumBox; chartBd[i] = sumBd;
        chartMmbf[i] = sumBd > 0 ? Math.round(sumBox / sumBd) : sumBox;
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
    if (d.year === sYear && (sMonth === 'ALL' || d.month === sMonth)) {
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
  const tb = document.getElementById('fileArchiveTableBody');
  let keys = Object.keys(uploadedDataStore);
  if (!keys.length) return tb.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada arsip database</td></tr>`;
  tb.innerHTML = keys.map(k => {
    let i = uploadedDataStore[k];
    let deleteBtnHtml = (currentUserRole === 'admin')
      ? `<button onclick="deleteFileRecord('${k}')" class="bg-red-600 hover:bg-red-700 text-white text-[10px] px-2 py-1 rounded shadow">Hapus</button>`
      : `<span class="text-slate-400 text-[10px] italic">Khusus Admin</span>`;
    return `<tr class="border-b"><td class="p-3 font-bold text-primary text-[11px] md:text-xs">${i.fileName}</td><td class="p-3 text-[11px] md:text-xs font-semibold">${i.month} ${i.year}</td><td class="p-3 text-[11px] md:text-xs">${(i.boxes || 0).toLocaleString('id-ID')}</td><td class="p-3 text-[11px] md:text-xs text-rose-600 font-bold">${i.bd || 0} BD</td><td class="p-3">${deleteBtnHtml}</td></tr>`;
  }).join('');
}

// ==========================================
// MANAJEMEN RIWAYAT CHAT & GOOGLE GEMINI API
// ==========================================
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
    messages: [{ sender: 'ai', text: `Halo rekan **${currentUsername}**, silakan tanyakan kendala lampu kabin, prosedur perbaikan komponen crane, atau rekapitulasi data TPS.` }]
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

const EXPERT_CC_KB = [
  {
    keywords: ['lampu', 'kabin', 'penerangan', 'lampu operator', 'lampu sorot', 'lampu indikator'],
    title: 'Sistem Penerangan Kabin & Panel Operator',
    guideline: `🛠️ **Panduan Teknis Perbaikan Lampu Kabin / Penerangan:**\n1. **K3 & LOTO:** Pasang gembok LOTO (*Lockout/Tagout*) pada panel sumber listrik AC/DC kabin sebelum menyentuh kabel.\n2. **Cek Sekring (Fuse) & MCB:** Periksa box panel elektrik di dalam kabin operator, pastikan MCB atau sekring tidak putus atau *trip*.\n3. **Kabel & Soket Plafon:** Periksa koneksi soket kabel di atas plafon kabin, pastikan tidak ada kabel kendur atau korosi akibat uap air laut.\n4. **Bohlam / LED Driver:** Periksa tegangan output jalur (umumnya 24V DC / 220V AC). Ganti lampu jika modul LED sudah terbakar.`
  },
  {
    keywords: ['hoist', 'angkat', 'main hoist', 'wire rope', 'drum', 'overload', 'limit switch hoist'],
    title: 'Sistem Hoist & Pengangkatan (Main Hoist)',
    guideline: `🛠️ **Panduan Teknis Hoist System:**\n1. **K3 & LOTO:** Pastikan crane dalam posisi *Zero Energy State* dan rem mekanis pengaman terkunci sebelum inspeksi drum.\n2. **Inspeksi Rem (Hoist Brake):** Periksa celah udara (*air gap*) dan kampas rem (*brake lining*).\n3. **Wire Rope & Drum:** Pastikan kawat seling tidak mengalami *birdcaging* atau putus helai.\n4. **Inverter & PLC Fault:** Periksa parameter inverter dan suhu motor hoist secara berkala.`
  },
  {
    keywords: ['spreader', 'flipper', 'twistlock', 'telescopic', 'landing', 'landed', 'pin'],
    title: 'Sistem Spreader & Twistlock',
    guideline: `🛠️ **Panduan Teknis Spreader:**\n1. **K3 & LOTO:** Amankan posisi spreader pada *maintenance trestle* atau posisi *landed* penuh.\n2. **Twistlock Pin & Sensor Proximity:** Periksa apakah pin macet atau sensor posisi *lock/unlock* tertutup kotoran/grease.\n3. **Flipper Arm:** Cek aktuator hidrolik flipper dan pastikan selang tidak mengalami kebocoran.`
  },
  {
    keywords: ['gantry', 'travel', 'rail', 'klamp', 'storm pin', 'anemometer'],
    title: 'Sistem Gantry (Crane Travel)',
    guideline: `🛠️ **Panduan Teknis Gantry Travel:**\n1. **K3 & LOTO:** Pastikan jalur rel steril dan *storm pin / rail clamp* dilepas sesuai prosedur aman.\n2. **Roda & Rel:** Cek keausan roda gantry (*gantry wheels*) serta kesikuan rel (*rail alignment*).\n3. **Storm Lock:** Pastikan pengunci angin (*rail clamp*) tidak mencengkeram saat crane bergerak.`
  },
  {
    keywords: ['trolley', 'puly', 'kabel tray', 'festoon', 'tow cable'],
    title: 'Sistem Trolley & Festoon',
    guideline: `🛠️ **Panduan Teknis Trolley:**\n1. **K3 & LOTO:** Lakukan pemutusan sumber daya utama (*Main Breaker LOTO*).\n2. **Festoon System:** Periksa *cable carrier* dan rol pengantar, pastikan kabel daya tidak terjepit.\n3. **Drive & Gearbox:** Cek pelumasan gearbox trolley dan sensor batas jalan (*limit switch*).`
  }
];

async function sendAiQuery() {
  const inputEl = document.getElementById('aiUserInput');
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

  currentSession.messages.push({ sender: 'ai', actionId: 'loading_ai', text: '🤖 Sedang menganalisis kendala teknis dan riwayat Work Order...' });
  renderActiveChatMessages();

  let aiReply = "";
  let activeKey = userCustomApiKey || "";

  if (activeKey) {
    try {
      const systemInstruction = `Anda adalah "AI Expert Maintenance & Reliability Engineer" di PT Terminal Petikemas Surabaya (TPS). 
Tugas utama Anda:
1. Memberikan solusi troubleshooting, analisis akar masalah (root cause), dan prosedur perbaikan teknis yang presisi dan aman untuk Container Crane.
2. CEGAH SALAH TANGKAP KONTEKS (Anti-False Match).
3. WAJIB MENYERTAKAN STANDAR K3 & LOTO (Lockout/Tagout) pada setiap instruksi perbaikan teknis.
4. Format Markdown rapi. Gunakan bahasa Indonesia profesional.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nPertanyaan Teknisi: ${rawQ}` }] }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          aiReply = data.candidates[0].content.parts[0].text;
        }
      }
    } catch (err) {
      console.warn("API Gemini gagal dipanggil, beralih ke Knowledge Base lokal:", err);
    }
  }

  if (!aiReply) {
    let lowerQ = rawQ.toLowerCase();
    let bestKbMatch = null;
    let maxKbScore = 0;

    EXPERT_CC_KB.forEach(kb => {
      let score = 0;
      kb.keywords.forEach(kw => {
        if (lowerQ.includes(kw)) score += (kw.length > 3 ? 3 : 1);
      });
      if (score > maxKbScore) {
        maxKbScore = score;
        bestKbMatch = kb;
      }
    });

    let bestWoMatch = null;
    let maxWoScore = 0;
    let searchWords = lowerQ.split(/[^a-z0-9]+/).filter(w => w.length > 3);

    if (searchWords.length > 0) {
      for (let k in uploadedDataStore) {
        if (uploadedDataStore[k].workOrders) {
          uploadedDataStore[k].workOrders.forEach(w => {
            let textLower = (w.desc + " " + w.task + " " + w.asset).toLowerCase();
            let matchScore = 0;
            searchWords.forEach(sw => {
              if (textLower.includes(sw)) matchScore += 2;
            });
            if (matchScore > maxWoScore) {
              maxWoScore = matchScore;
              bestWoMatch = w;
            }
          });
        }
      }
    }

    aiReply = `🤖 **Respon Pakar AI Maintenance PT TPS:**\n\n`;

    if (bestKbMatch && maxKbScore >= 3) {
      aiReply += `${bestKbMatch.guideline}\n\n`;
    }

    if (bestWoMatch && maxWoScore >= 4) {
      aiReply += `📁 **Referensi Arsip Work Order Relevan:**\n`;
      aiReply += `• **Problem:** *"${bestWoMatch.desc}"*\n`;
      aiReply += `• **Unit:** ${bestWoMatch.asset} | **Tanggal:** ${bestWoMatch.tanggal} | **No. WO:** ${bestWoMatch.woNum}\n`;
      aiReply += `• **Sistem:** ${bestWoMatch.task} (Downtime: ${bestWoMatch.durasiStr})\n\n`;
    }

    if (!bestKbMatch || maxKbScore < 3) {
      if (!bestWoMatch || maxWoScore < 4) {
        aiReply += `🛠️ **Panduan Diagnostik Umum:**\n`;
        aiReply += `Untuk pertanyaan **"${rawQ}"**, pastikan Anda melakukan pemeriksaan fisik pada komponen terkait, ikuti standar K3 & prosedur LOTO, serta verifikasi status interlock PLC.\n\n`;
      }
    }

    aiReply += `💡 *Selalu utamakan keselamatan kerja dan pastikan LOTO terpasang sebelum perbaikan di lapangan.*`;
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