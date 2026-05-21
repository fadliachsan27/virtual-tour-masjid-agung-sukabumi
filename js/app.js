import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, addDoc, updateDoc,
  query, orderBy, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey:            "AIzaSyA6b5hiSH7BWAXOWu3_-cwXtMl6J3sTGxA",
  authDomain:        "vt-masjid-agung-sukabumi.firebaseapp.com",
  projectId:         "vt-masjid-agung-sukabumi",
  storageBucket:     "vt-masjid-agung-sukabumi.firebasestorage.app",
  messagingSenderId: "633933684627",
  appId:             "1:633933684627:web:fdcaa9d3ff99475e665266",
  measurementId:     "G-GG88GW221Z"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const isAdminPage = !!document.getElementById('page-dashboard');

if (isAdminPage) {

// ===== AUTH CHECK =====
if (localStorage.getItem('adminLoggedIn') !== '1') {
  window.location.href = 'login.html';
}

function doLogout() {
  localStorage.removeItem('adminLoggedIn');
  window.location.href = 'login.html';
}
window.doLogout = doLogout;


// ============================================================
// PAGE SWITCHER
// ============================================================
function showPage(name, el) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  document.getElementById('page-' + name).style.display = 'block';
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');

  if (name === 'panorama') initPanoPreview();
  if (name === 'galeri')   loadGaleri();
  if (name === 'pengurus') loadPengurus();
  if (name === 'imam')     loadImamMuadzin();
  if (name === 'info')     loadInfoForm();
  if (name === 'dashboard') updateDashboardStats();
  if (name === 'event')    loadEvents();
  return false;
}
window.showPage = showPage;

// ============================================================
// EVENT MANAGEMENT
// ============================================================
let eventItems = [];
let editEventId = null;
let eventPendingBase64 = null;
let eventPendingType = null;

async function loadEvents() {
  try {
    const snap = await getDocs(query(collection(db, 'events'), orderBy('order', 'desc')));
    eventItems = [];
    snap.forEach(d => eventItems.push({ id: d.id, ...d.data() }));
    renderEventTable();
  } catch (e) { showToast('⚠ Gagal memuat event: ' + e.message); }
}

function formatIndonesianDate(dateStr) {
  if (!dateStr) return '-';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  try {
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(date.getTime())) return dateStr;
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

function renderEventTable() {
  const tbody = document.getElementById('eventAdminTableBody');
  if (!tbody) return;
  if (eventItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px">Belum ada data event.</td></tr>`;
    return;
  }
  tbody.innerHTML = '';
  eventItems.forEach((item, idx) => {
    const tr = document.createElement('tr');
    
    let mediaHtml = '';
    if (item.mediaBase64) {
      if (item.mediaType === 'video') {
        mediaHtml = `<video src="${item.mediaBase64}" style="width:100px;height:56px;object-fit:cover;border-radius:4px" preload="metadata"></video>`;
      } else {
        mediaHtml = `<img src="${item.mediaBase64}" style="width:100px;height:56px;object-fit:cover;border-radius:4px" alt="${item.judul}"/>`;
      }
    } else {
      mediaHtml = `<span style="font-size:24px">🕌</span>`;
    }
    
    tr.innerHTML = `
      <td>${mediaHtml}</td>
      <td style="font-weight:bold;color:#fff">${item.judul || '-'}</td>
      <td><span class="hari-badge">${formatIndonesianDate(item.tanggal) || '-'}</span></td>
      <td style="color:var(--muted);max-width:250px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.deskripsi || '-'}</td>
      <td>
        <button class="btn-sm" onclick="editEvent('${item.id}')">✏️ Edit</button>
        <button class="btn-danger" style="margin-left:5px" onclick="deleteEvent('${item.id}')">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEventModal(id) {
  editEventId = id || null;
  eventPendingBase64 = null;
  eventPendingType = 'image';

  document.getElementById('eventModalTitle').textContent = id ? 'Edit Event' : 'Tambah Event';
  document.getElementById('eventJudul').value = '';
  document.getElementById('eventTanggal').value = '';
  document.getElementById('eventDeskripsi').value = '';
  document.getElementById('eventMediaInput').value = '';
  document.getElementById('eventMediaPreview').innerHTML = `
    <span style="color:var(--muted)">Belum ada media dipilih</span>
    <span style="font-size:12px;color:var(--gold)">📁 Klik atau Drag & Drop file di sini</span>
  `;

  if (id) {
    const item = eventItems.find(e => e.id === id);
    if (item) {
      document.getElementById('eventJudul').value = item.judul || '';
      
      let dateVal = '';
      if (item.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(item.tanggal)) {
        dateVal = item.tanggal;
      }
      document.getElementById('eventTanggal').value = dateVal;
      
      document.getElementById('eventDeskripsi').value = item.deskripsi || '';
      if (item.mediaBase64) {
        eventPendingBase64 = item.mediaBase64;
        document.getElementById('eventMediaPreview').innerHTML = `
          <img src="${item.mediaBase64}" style="max-width:100%;max-height:100%;object-fit:contain"/>
          <div class="media-change-badge" onclick="event.stopPropagation(); document.getElementById('eventMediaInput').click()"><span style="margin-right:2px;">🔄</span> Ganti Foto</div>
        `;
      }
    }
  }
  document.getElementById('eventModal').classList.add('open');
}

async function previewEventMedia(file) {
  if (!file) return;
  if (file.size > 209715200) {
    showToast('⚠ Ukuran file melebihi 200MB! Pilih file yang lebih kecil atau kompres terlebih dahulu.');
    document.getElementById('eventMediaInput').value = '';
    return;
  }
  showToast('⏳ Memproses foto...', 5000);
  
  if (file.type.startsWith('image/')) {
    eventPendingType = 'image';
    eventPendingBase64 = await compressToBase64(file, 1000, 0.8);
    document.getElementById('eventMediaPreview').innerHTML = `
      <img src="${eventPendingBase64}" style="max-width:100%;max-height:100%;object-fit:contain"/>
      <div class="media-change-badge" onclick="event.stopPropagation(); document.getElementById('eventMediaInput').click()"><span style="margin-right:2px;">🔄</span> Ganti Foto</div>
    `;
    showToast('📸 Foto siap — klik Simpan');
  } else {
    showToast('⚠ Format file tidak didukung! Pilih file gambar.');
  }
}

async function saveEvent() {
  const judul = document.getElementById('eventJudul').value.trim();
  const tanggal = document.getElementById('eventTanggal').value.trim();
  const deskripsi = document.getElementById('eventDeskripsi').value.trim();

  if (!judul) {
    showToast('⚠ Judul event tidak boleh kosong!');
    return;
  }
  if (!tanggal) {
    showToast('⚠ Tanggal event tidak boleh kosong!');
    return;
  }
  if (!deskripsi) {
    showToast('⚠ Deskripsi event tidak boleh kosong!');
    return;
  }
  if (!eventPendingBase64) {
    showToast('⚠ Foto event tidak boleh kosong!');
    return;
  }

  const data = {
    judul,
    tanggal,
    deskripsi,
    mediaBase64: eventPendingBase64 || null,
    mediaType: eventPendingType || null,
    order: editEventId ? (eventItems.find(e => e.id === editEventId)?.order || Date.now()) : Date.now(),
    createdAt: serverTimestamp()
  };

  try {
    if (editEventId) {
      await updateDoc(doc(db, 'events', editEventId), {
        judul, tanggal, deskripsi,
        mediaBase64: eventPendingBase64 || null,
        mediaType: eventPendingType || null
      });
    } else {
      await addDoc(collection(db, 'events'), data);
    }
    closeEventModal();
    await loadEvents();
    showToast('✅ Event berhasil disimpan!');
  } catch (e) {
    showToast('⚠ Gagal menyimpan: ' + e.message);
  }
}

async function deleteEvent(id) {
  openConfirmModal('Hapus event ini?', async () => {
    try {
      await deleteDoc(doc(db, 'events', id));
      await loadEvents();
      showToast('🗑 Event dihapus');
    } catch (e) {
      showToast('⚠ Gagal menghapus: ' + e.message);
    }
  });
}

function openConfirmModal(message, onConfirm) {
  const overlay = document.getElementById('confirmModal');
  const messageEl = document.getElementById('confirmMessage');
  const actionButton = document.getElementById('confirmActionButton');
  if (!overlay || !messageEl || !actionButton) {
    return onConfirm();
  }

  messageEl.textContent = message;
  overlay.classList.add('open');
  actionButton.onclick = async () => {
    overlay.classList.remove('open');
    await onConfirm();
  };
}

function closeConfirmModal() {
  const overlay = document.getElementById('confirmModal');
  if (!overlay) return;
  overlay.classList.remove('open');
}

function closeEventModal() {
  document.getElementById('eventModal').classList.remove('open');
}

// Bind to window for global access
window.loadEvents = loadEvents;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
window.saveEvent = saveEvent;
window.deleteEvent = deleteEvent;
window.editEvent = openEventModal;
window.previewEventMedia = previewEventMedia;
window.closeConfirmModal = closeConfirmModal;

// Drag & drop — event media preview
const emp = document.getElementById('eventMediaPreview');
if (emp) {
  emp.addEventListener('dragover', e => {
    e.preventDefault();
    emp.classList.add('drag-over');
  });
  emp.addEventListener('dragleave', () => emp.classList.remove('drag-over'));
  emp.addEventListener('drop', e => {
    e.preventDefault();
    emp.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      previewEventMedia(e.dataTransfer.files[0]);
    }
  });
}

// ===== TOAST =====
function showToast(msg, dur) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), dur || 3000);
}
window.showToast = showToast;


// ============================================================
// IMAGE COMPRESSION → BASE64
// ============================================================
function compressToBase64(file, maxW, quality) {
  return new Promise(res => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxW / img.width);
      const w = Math.round(img.width  * ratio);
      const h = Math.round(img.height * ratio);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      res(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}


// ============================================================
// DASHBOARD STATS
// ============================================================
async function updateDashboardStats() {
  try {
    const [galeriSnap, pengurusSnap, jadwalSnap] = await Promise.all([
      getDocs(collection(db, 'galeri')),
      getDocs(collection(db, 'pengurus')),
      getDoc(doc(db, 'imam_muadzin', 'jadwal'))
    ]);
    document.getElementById('statGaleri').textContent   = galeriSnap.size;
    document.getElementById('statPengurus').textContent = pengurusSnap.size;
    const jadwal = jadwalSnap.exists() ? jadwalSnap.data() : {};
    document.getElementById('statImam').textContent    = (jadwal.imam    || []).length;
    document.getElementById('statMuadzin').textContent = (jadwal.muadzin || []).length;
  } catch (e) { console.error(e); }
}


// ============================================================
// INFORMASI MASJID
// ============================================================
let fiturRows = [];

async function loadInfoForm() {
  try {
    const [infoSnap, fiturSnap] = await Promise.all([
      getDoc(doc(db, 'masjid_info', 'info')),
      getDoc(doc(db, 'masjid_info', 'fitur'))
    ]);
    if (infoSnap.exists()) {
      const d = infoSnap.data();
      document.getElementById('infoJudul').value     = d.judul     || '';
      document.getElementById('infoDeskripsi').value = d.deskripsi || '';
      document.getElementById('infoKapasitas').value = d.kapasitas || '';
      document.getElementById('infoBerdiri').value   = d.berdiri   || '';
      document.getElementById('infoLuas').value      = d.luas      || '';
      document.getElementById('infoMenara').value    = d.menara    || '';
    }
    fiturRows = fiturSnap.exists() ? (fiturSnap.data().items || []) : [
      { icon: '🕌', judul: 'Ruang Utama Shalat',      deskripsi: 'Pusat ibadah dengan mihrab megah dan kubah utama yang menakjubkan.' },
      { icon: '🏛️', judul: 'Aula & Selasar Multifungsi', deskripsi: 'Ruang serbaguna untuk kajian, pengajian, dan kegiatan sosial.' },
      { icon: '📚', judul: 'Perpustakaan Islam',       deskripsi: 'Koleksi kitab dan buku Islam untuk pendidikan agama.' },
      { icon: '🌿', judul: 'Halaman & Taman Asri',    deskripsi: 'Area luar masjid yang rindang dan nyaman.' },
    ];
    renderFiturRows();
  } catch (e) { showToast('⚠ Gagal memuat data: ' + e.message); }
}

function renderFiturRows() {
  const container = document.getElementById('fiturList');
  container.innerHTML = fiturRows.map((f, i) => `
    <div style="display:grid;grid-template-columns:60px 1fr 2fr auto;gap:10px;align-items:center;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:12px">
      <div class="form-group" style="margin:0">
        <input type="text" value="${f.icon}" onchange="fiturRows[${i}].icon=this.value" style="text-align:center;font-size:18px" maxlength="4"/>
      </div>
      <div class="form-group" style="margin:0">
        <input type="text" value="${f.judul}" onchange="fiturRows[${i}].judul=this.value" placeholder="Judul Fitur"/>
      </div>
      <div class="form-group" style="margin:0">
        <input type="text" value="${f.deskripsi}" onchange="fiturRows[${i}].deskripsi=this.value" placeholder="Deskripsi"/>
      </div>
      <button class="btn-danger" style="padding:6px 10px" onclick="confirmDeleteFiturRow(${i})">🗑</button>
    </div>`).join('');
}

function addFiturRow() {
  fiturRows.push({ icon: '🕌', judul: '', deskripsi: '' });
  renderFiturRows();
}

function deleteFiturRow(i) {
  fiturRows.splice(i, 1);
  renderFiturRows();
}

function confirmDeleteFiturRow(i) {
  openConfirmModal('Hapus fitur ini?', () => { deleteFiturRow(i); });
}

async function saveInfoMasjid() {
  // Sync any inline edits before saving
  document.querySelectorAll('#fiturList > div').forEach((div, i) => {
    const inputs = div.querySelectorAll('input');
    if (fiturRows[i]) {
      fiturRows[i].icon      = inputs[0].value;
      fiturRows[i].judul     = inputs[1].value;
      fiturRows[i].deskripsi = inputs[2].value;
    }
  });

  const info = {
    judul:     document.getElementById('infoJudul').value,
    deskripsi: document.getElementById('infoDeskripsi').value,
    kapasitas: document.getElementById('infoKapasitas').value,
    berdiri:   document.getElementById('infoBerdiri').value,
    luas:      document.getElementById('infoLuas').value,
    menara:    document.getElementById('infoMenara').value,
  };

  try {
    await Promise.all([
      setDoc(doc(db, 'masjid_info', 'info'),  info),
      setDoc(doc(db, 'masjid_info', 'fitur'), { items: fiturRows })
    ]);
    showToast('✅ Informasi masjid berhasil disimpan!');
  } catch (e) { showToast('⚠ Gagal simpan: ' + e.message); }
}

window.addFiturRow    = addFiturRow;
window.deleteFiturRow = deleteFiturRow;
window.confirmDeleteFiturRow = confirmDeleteFiturRow;
window.saveInfoMasjid = saveInfoMasjid;


// ============================================================
// PROFIL PENGURUS
// ============================================================
let pengurusItems       = [];
let editPengurusId      = null;
let pengurusPendingBase64 = null;

async function loadPengurus() {
  try {
    const snap = await getDocs(query(collection(db, 'pengurus'), orderBy('order', 'asc')));
    pengurusItems = [];
    snap.forEach(d => pengurusItems.push({ id: d.id, ...d.data() }));
    renderPengurusGrid();
  } catch (e) { showToast('⚠ Gagal memuat pengurus: ' + e.message); }
}

function renderPengurusGrid() {
  const grid = document.getElementById('pengurusAdminGrid');
  if (pengurusItems.length === 0) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:20px">Belum ada data pengurus.</div>';
    return;
  }
  grid.innerHTML = '';
  pengurusItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'pengurus-admin-card';
    const avatarHtml = item.fotoBase64
      ? `<img class="pengurus-admin-avatar" src="${item.fotoBase64}" alt="${item.nama}"/>`
      : `<div class="pengurus-admin-placeholder">👤</div>`;
    card.innerHTML = `
      ${avatarHtml}
      <div class="pengurus-admin-jabatan">${item.jabatan || 'Pengurus'}</div>
      <div class="pengurus-admin-nama">${item.nama || '-'}</div>
      <div style="font-size:11px;color:var(--muted)">${item.periode || ''}</div>
      <div class="pengurus-admin-actions">
        <button class="btn-sm" onclick="editPengurus('${item.id}')">✏️ Edit</button>
        <button class="btn-danger" onclick="deletePengurus('${item.id}')">🗑</button>
      </div>`;
    grid.appendChild(card);
  });
}

function openPengurusModal(id) {
  editPengurusId       = id || null;
  pengurusPendingBase64 = null;

  document.getElementById('pengurusModalTitle').textContent = id ? 'Edit Pengurus' : 'Tambah Pengurus';
  document.getElementById('pengurusNama').value    = '';
  document.getElementById('pengurusJabatan').value = '';
  document.getElementById('pengurusPeriode').value = '';
  document.getElementById('pengurusFotoInput').value = '';
  document.getElementById('pengurusAvatarPreview').innerHTML = '👤';

  if (id) {
    const item = pengurusItems.find(p => p.id === id);
    if (item) {
      document.getElementById('pengurusNama').value    = item.nama    || '';
      document.getElementById('pengurusJabatan').value = item.jabatan || '';
      document.getElementById('pengurusPeriode').value = item.periode || '';
      if (item.fotoBase64) {
        document.getElementById('pengurusAvatarPreview').innerHTML =
          `<img src="${item.fotoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
        pengurusPendingBase64 = item.fotoBase64;
      }
    }
  }
  document.getElementById('pengurusModal').classList.add('open');
}

async function previewPengurusFoto(file) {
  if (!file || !file.type.startsWith('image/')) return;
  showToast('⏳ Memproses foto...', 10000);
  pengurusPendingBase64 = await compressToBase64(file, 600, 0.85);
  document.getElementById('pengurusAvatarPreview').innerHTML =
    `<img src="${pengurusPendingBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  showToast('📷 Foto siap — klik Simpan');
}
window.previewPengurusFoto = previewPengurusFoto;

async function savePengurus() {
  const nama    = document.getElementById('pengurusNama').value.trim();
  const jabatan = document.getElementById('pengurusJabatan').value.trim();
  const periode = document.getElementById('pengurusPeriode').value.trim();
  if (!nama || !jabatan) { showToast('⚠ Nama dan Jabatan wajib diisi!'); return; }

  const data = {
    nama, jabatan, periode,
    fotoBase64: pengurusPendingBase64 || null,
    order:      Date.now(),
    createdAt:  serverTimestamp()
  };

  try {
    if (editPengurusId) {
      await updateDoc(doc(db, 'pengurus', editPengurusId),
        { nama, jabatan, periode, fotoBase64: pengurusPendingBase64 || null });
    } else {
      await addDoc(collection(db, 'pengurus'), data);
    }
    closePengurusModal();
    await loadPengurus();
    showToast('✅ Pengurus berhasil disimpan!');
  } catch (e) { showToast('⚠ Gagal simpan: ' + e.message); }
}

async function deletePengurus(id) {
  openConfirmModal('Hapus pengurus ini?', async () => {
    try {
      await deleteDoc(doc(db, 'pengurus', id));
      await loadPengurus();
      showToast('🗑 Pengurus dihapus');
    } catch (e) { showToast('⚠ ' + e.message); }
  });
}

function closePengurusModal() {
  document.getElementById('pengurusModal').classList.remove('open');
}

function editPengurus(id) { openPengurusModal(id); }

window.openPengurusModal  = openPengurusModal;
window.closePengurusModal = closePengurusModal;
window.editPengurus       = editPengurus;
window.deletePengurus     = deletePengurus;
window.savePengurus       = savePengurus;

document.getElementById('pengurusFotoInput')
  .addEventListener('change', e => previewPengurusFoto(e.target.files[0]));


// ============================================================
// IMAM & MUADZIN
// ============================================================
let imamData = [], muadzinData = [];

async function loadImamMuadzin() {
  try {
    const snap  = await getDoc(doc(db, 'imam_muadzin', 'jadwal'));
    imamData    = snap.exists() ? (snap.data().imam    || []) : [];
    muadzinData = snap.exists() ? (snap.data().muadzin || []) : [];
    renderImamMuadzinTables();
  } catch (e) { showToast('⚠ ' + e.message); }
}

function renderImamMuadzinTables() { renderImamTable(); renderMuadzinTable(); }

function renderImamTable() {
  const tbody = document.getElementById('imamTableBody');
  tbody.innerHTML = imamData.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px">Belum ada data imam</td></tr>`
    : imamData.map((item, i) => `
        <tr>
          <td><span class="hari-badge">${item.hari}</span></td>
          <td>${item.nama}</td>
          <td style="color:var(--muted)">${item.keterangan || '-'}</td>
          <td><button class="btn-danger" onclick="confirmDeleteImamRow(${i})">🗑</button></td>
        </tr>`).join('');
}

function renderMuadzinTable() {
  const tbody = document.getElementById('muadzinTableBody');
  tbody.innerHTML = muadzinData.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px">Belum ada data muadzin</td></tr>`
    : muadzinData.map((item, i) => `
        <tr>
          <td><span class="hari-badge">${item.hari}</span></td>
          <td>${item.nama}</td>
          <td style="color:var(--muted)">${item.keterangan || '-'}</td>
          <td><button class="btn-danger" onclick="confirmDeleteMuadzinRow(${i})">🗑</button></td>
        </tr>`).join('');
}

function addImamRow() {
  const hari = document.getElementById('addImamHari').value;
  const nama = document.getElementById('addImamNama').value.trim();
  const ket  = document.getElementById('addImamKet').value.trim();
  if (!nama) { showToast('⚠ Nama imam wajib diisi!'); return; }
  imamData.push({ hari, nama, keterangan: ket });
  document.getElementById('addImamNama').value = '';
  document.getElementById('addImamKet').value  = '';
  renderImamTable();
}

function addMuadzinRow() {
  const hari = document.getElementById('addMuadzinHari').value;
  const nama = document.getElementById('addMuadzinNama').value.trim();
  const ket  = document.getElementById('addMuadzinKet').value.trim();
  if (!nama) { showToast('⚠ Nama muadzin wajib diisi!'); return; }
  muadzinData.push({ hari, nama, keterangan: ket });
  document.getElementById('addMuadzinNama').value = '';
  document.getElementById('addMuadzinKet').value  = '';
  renderMuadzinTable();
}

function deleteImamRow(i)    { imamData.splice(i, 1);    renderImamTable(); }
function deleteMuadzinRow(i) { muadzinData.splice(i, 1); renderMuadzinTable(); }

function confirmDeleteImamRow(i) {
  openConfirmModal('Hapus jadwal imam ini?', () => { deleteImamRow(i); });
}

function confirmDeleteMuadzinRow(i) {
  openConfirmModal('Hapus jadwal muadzin ini?', () => { deleteMuadzinRow(i); });
}

async function saveImamMuadzin() {
  try {
    await setDoc(doc(db, 'imam_muadzin', 'jadwal'), { imam: imamData, muadzin: muadzinData });
    showToast('✅ Jadwal imam & muadzin berhasil disimpan!');
    updateDashboardStats();
  } catch (e) { showToast('⚠ Gagal simpan: ' + e.message); }
}

window.addImamRow      = addImamRow;
window.addMuadzinRow   = addMuadzinRow;
window.deleteImamRow   = deleteImamRow;
window.deleteMuadzinRow = deleteMuadzinRow;
window.confirmDeleteImamRow = confirmDeleteImamRow;
window.confirmDeleteMuadzinRow = confirmDeleteMuadzinRow;
window.saveImamMuadzin = saveImamMuadzin;


// ============================================================
// GALERI — Base64 di Firestore
// ============================================================
let galeriItems = [], galeriReplaceId = null;
let activeGaleriUploadKategori = 'luar';
window.activeGaleriUploadKategori = 'luar';

function kategoriLabelGaleri(kategori) {
  return kategori === 'dalam' ? 'Foto bagian dalam' : 'Foto bagian luar';
}

function setActiveGaleriKategori(kategori) {
  activeGaleriUploadKategori = kategori === 'dalam' ? 'dalam' : 'luar';
  window.activeGaleriUploadKategori = activeGaleriUploadKategori;
  document.getElementById('galeriKategoriAktifText').textContent = kategoriLabelGaleri(activeGaleriUploadKategori);
}

function triggerAddGaleri(kategori) {
  setActiveGaleriKategori(kategori);
  document.getElementById('galeriAddInput').click();
}

function triggerBulkGaleri(kategori) {
  setActiveGaleriKategori(kategori);
  document.getElementById('galeriBulkInput').click();
}

async function loadGaleri() {
  const gridLuar = document.getElementById('galeriAdminGridLuar');
  const gridDalam = document.getElementById('galeriAdminGridDalam');
  gridLuar.innerHTML = '<div style="color:var(--muted);text-align:center;padding:30px;grid-column:1/-1">⏳ Memuat...</div>';
  gridDalam.innerHTML = '<div style="color:var(--muted);text-align:center;padding:30px;grid-column:1/-1">⏳ Memuat...</div>';
  try {
    const snap = await getDocs(query(collection(db, 'galeri'), orderBy('order', 'asc')));
    galeriItems = [];
    snap.forEach(d => galeriItems.push({ id: d.id, ...d.data() }));
    document.getElementById('galeriCount').textContent = galeriItems.length + ' foto';
    renderGaleriGrid();
    updateDashboardStats();
  } catch (e) {
    showToast('⚠ Gagal memuat galeri: ' + e.message);
    gridLuar.innerHTML = '';
    gridDalam.innerHTML = '';
  }
}

function renderGaleriGrid() {
  const gridLuar = document.getElementById('galeriAdminGridLuar');
  const gridDalam = document.getElementById('galeriAdminGridDalam');
  gridLuar.innerHTML = '';
  gridDalam.innerHTML = '';

  const itemsLuar = galeriItems.filter(item => (item.kategori || 'luar') === 'luar');
  const itemsDalam = galeriItems.filter(item => item.kategori === 'dalam');
  document.getElementById('galeriCountLuar').textContent = itemsLuar.length + ' foto';
  document.getElementById('galeriCountDalam').textContent = itemsDalam.length + ' foto';

  function renderItems(items, grid, offset) {
    if (items.length === 0) {
      grid.innerHTML = '<div style="color:var(--muted);text-align:center;padding:24px;grid-column:1/-1">Belum ada foto.</div>';
      return;
    }
    items.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'galeri-admin-item';
      div.innerHTML = `
        <img src="${item.base64}" alt="Foto ${offset + idx + 1}" loading="lazy"/>
        <div class="galeri-item-num">#${offset + idx + 1}</div>
        <div class="galeri-item-overlay">
          <div class="galeri-item-actions">
            <button class="btn-item-replace" onclick="triggerReplace('${item.id}')">🔄 Ganti</button>
            <button class="btn-item-delete"  onclick="deleteGaleriItem('${item.id}')">🗑</button>
          </div>
        </div>`;
      grid.appendChild(div);
    });
  }

  renderItems(itemsLuar, gridLuar, 0);
  renderItems(itemsDalam, gridDalam, itemsLuar.length);
}

async function addGaleriFiles(files, kategori) {
  if (!files || files.length === 0) return;
  const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (arr.length === 0) return;
  const kategoriFinal = kategori === 'dalam' ? 'dalam' : 'luar';

  document.getElementById('galeriProgress').style.display = 'block';
  document.getElementById('galeriProgressFill').style.width = '0%';
  showToast('⏳ Menyimpan ' + arr.length + ' ' + kategoriLabelGaleri(kategoriFinal).toLowerCase() + ' ke Firestore...', 60000);

  for (let i = 0; i < arr.length; i++) {
    const base64 = await compressToBase64(arr[i], 1200, 0.78);
    if (!base64) continue;
    await addDoc(collection(db, 'galeri'), {
      base64,
      kategori: kategoriFinal,
      order: Date.now() + i,
      createdAt: serverTimestamp()
    });
    document.getElementById('galeriProgressFill').style.width =
      Math.round(((i + 1) / arr.length) * 100) + '%';
  }

  document.getElementById('galeriProgress').style.display = 'none';
  await loadGaleri();
  showToast('✅ ' + arr.length + ' ' + kategoriLabelGaleri(kategoriFinal).toLowerCase() + ' berhasil disimpan!');
  document.getElementById('galeriAddInput').value  = '';
  document.getElementById('galeriBulkInput').value = '';
}

function triggerReplace(id) {
  galeriReplaceId = id;
  document.getElementById('galeriReplaceInput').value = '';
  document.getElementById('galeriReplaceInput').click();
}

async function replaceGaleriFile(file) {
  if (!file || !galeriReplaceId) return;
  showToast('⏳ Memproses...', 15000);
  const base64 = await compressToBase64(file, 1200, 0.78);
  if (!base64) { showToast('⚠ Gagal proses foto'); return; }
  await updateDoc(doc(db, 'galeri', galeriReplaceId), { base64 });
  galeriReplaceId = null;
  await loadGaleri();
  showToast('✅ Foto berhasil diganti!');
}

async function deleteGaleriItem(id) {
  openConfirmModal('Hapus foto ini?', async () => {
    await deleteDoc(doc(db, 'galeri', id));
    await loadGaleri();
    showToast('🗑 Foto dihapus');
  });
}

async function confirmClearGaleri() {
  openConfirmModal('Hapus SEMUA foto dari galeri?', async () => {
    const snap  = await getDocs(collection(db, 'galeri'));
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    await loadGaleri();
    showToast('🗑 Semua foto galeri dihapus');
  });
}

window.triggerReplace     = triggerReplace;
window.deleteGaleriItem   = deleteGaleriItem;
window.confirmClearGaleri = confirmClearGaleri;
window.addGaleriFiles     = addGaleriFiles;
window.triggerAddGaleri   = triggerAddGaleri;
window.triggerBulkGaleri  = triggerBulkGaleri;

document.getElementById('galeriReplaceInput')
  .addEventListener('change', e => replaceGaleriFile(e.target.files[0]));

// Drag & drop — galeri
const dz = document.getElementById('galeriDropZone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'));
dz.addEventListener('drop', e => {
  e.preventDefault(); dz.classList.remove('drag-over');
  addGaleriFiles(e.dataTransfer.files, activeGaleriUploadKategori);
});


// ============================================================
// HERO BACKGROUND
// ============================================================
let heroPendingBase64 = null;

async function loadHeroPreview() {
  try {
    const snap = await getDoc(doc(db, 'panorama', 'hero_bg'));
    if (snap.exists() && snap.data().base64) {
      document.getElementById('heroPreviewImg').src = snap.data().base64;
    }
  } catch (e) { /* silent */ }
}

async function handleHeroFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  showToast('⏳ Memproses...', 15000);
  heroPendingBase64 = await compressToBase64(file, 3000, 0.85);
  document.getElementById('heroPreviewImg').src = heroPendingBase64;
  showToast('📷 Foto dipilih — klik Simpan');
}

async function saveHeroBg() {
  if (!heroPendingBase64) { showToast('⚠ Pilih foto dulu!'); return; }
  try {
    await setDoc(doc(db, 'panorama', 'hero_bg'), { base64: heroPendingBase64 });
    showToast('✅ Background hero disimpan!');
  } catch (e) { showToast('⚠ ' + e.message); }
}

async function resetHeroBg() {
  try {
    await deleteDoc(doc(db, 'panorama', 'hero_bg'));
    heroPendingBase64 = null;
    document.getElementById('heroPreviewImg').src = '../images/hero-360.png';
    document.getElementById('heroFileInput').value = '';
    showToast('↩ Background direset ke default');
  } catch (e) { showToast('⚠ ' + e.message); }
}

document.getElementById('heroFileInput')
  .addEventListener('change', e => handleHeroFile(e.target.files[0]));

// Drag & drop — hero
const ha = document.getElementById('heroUploadArea');
ha.addEventListener('dragover', e => { e.preventDefault(); ha.classList.add('drag-over'); });
ha.addEventListener('dragleave', ()  => ha.classList.remove('drag-over'));
ha.addEventListener('drop', e => {
  e.preventDefault(); ha.classList.remove('drag-over');
  handleHeroFile(e.dataTransfer.files[0]);
});

window.saveHeroBg  = saveHeroBg;
window.resetHeroBg = resetHeroBg;


// ============================================================
// PANORAMA — Chunked Base64 di Firestore
// Firestore max 1MB/doc → pecah jadi chunk 700KB
// ============================================================
const CHUNK_SIZE = 700_000; // 700 KB per chunk

const panoLocations = [
  { name: 'Ruang Utama (Mihrab)', key: 'pano_0' },
  { name: 'Aula & Selasar',       key: 'pano_1' },
  { name: 'Halaman & Taman',      key: 'pano_2' },
  { name: 'Menara & Kubah',       key: 'pano_3' },
];

let currentPanoLoc   = 0;
let panoPendingBase64 = {};
let panoLoadedBase64  = {};
let panoViewer        = null;

async function savePanoChunked(key, base64) {
  const chunks = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }
  // Store metadata
  await setDoc(doc(db, 'panorama', key), { chunks: chunks.length, updatedAt: Date.now() });
  // Store each chunk as a sub-document
  await Promise.all(
    chunks.map((chunk, i) =>
      setDoc(doc(db, 'panorama_chunks', key + '_' + i), { data: chunk, index: i })
    )
  );
}

async function loadPanoChunked(key) {
  const meta = await getDoc(doc(db, 'panorama', key));
  if (!meta.exists()) return null;
  const numChunks = meta.data().chunks;
  if (!numChunks) return meta.data().base64 || null; // fallback: old format
  const chunkDocs = await Promise.all(
    Array.from({ length: numChunks }, (_, i) =>
      getDoc(doc(db, 'panorama_chunks', key + '_' + i))
    )
  );
  return chunkDocs.map(d => d.exists() ? d.data().data : '').join('');
}

async function deletePanoChunked(key) {
  const meta = await getDoc(doc(db, 'panorama', key));
  if (meta.exists()) {
    const numChunks = meta.data().chunks || 0;
    await Promise.all(
      Array.from({ length: numChunks }, (_, i) =>
        deleteDoc(doc(db, 'panorama_chunks', key + '_' + i))
      )
    );
  }
  await deleteDoc(doc(db, 'panorama', key));
}

async function loadAllPanoFromDB() {
  for (let i = 0; i < panoLocations.length; i++) {
    try {
      const b64 = await loadPanoChunked(panoLocations[i].key);
      if (b64) panoLoadedBase64[i] = b64;
    } catch (e) { /* silent */ }
  }
}

function initPanoPreview() {
  const src = panoPendingBase64[currentPanoLoc] || panoLoadedBase64[currentPanoLoc] || '../images/hero-360.png';
  const box = document.getElementById('panoPreviewBox');
  box.innerHTML = '';
  if (panoViewer) { try { panoViewer.destroy(); } catch (e) {} panoViewer = null; }
  panoViewer = pannellum.viewer('panoPreviewBox', {
    type:         'equirectangular',
    panorama:     src,
    autoLoad:     true,
    autoRotate:   -2,
    showControls: true,
    hfov:         100
  });
}

function selectPanoLoc(idx, el) {
  currentPanoLoc = idx;
  document.querySelectorAll('.loc-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  initPanoPreview();
}

async function handlePanoFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  showToast('⏳ Memproses foto 360°...', 30000);
  panoPendingBase64[currentPanoLoc] = await compressToBase64(file, 3000, 0.75);
  initPanoPreview();
  showToast('📸 Foto dipilih — klik Simpan');
}

async function savePano() {
  const base64 = panoPendingBase64[currentPanoLoc];
  if (!base64) { showToast('⚠ Belum ada foto!'); return; }
  const key = panoLocations[currentPanoLoc].key;
  showToast('⏳ Menyimpan foto panorama...', 60000);
  try {
    await savePanoChunked(key, base64);
    panoLoadedBase64[currentPanoLoc] = base64;
    showToast('✅ Foto "' + panoLocations[currentPanoLoc].name + '" disimpan!');
  } catch (e) { showToast('⚠ Gagal simpan: ' + e.message); }
}

async function resetPano() {
  const key = panoLocations[currentPanoLoc].key;
  try {
    await deletePanoChunked(key);
    delete panoPendingBase64[currentPanoLoc];
    delete panoLoadedBase64[currentPanoLoc];
    document.getElementById('panoFileInput').value = '';
    initPanoPreview();
    showToast('↩ Foto "' + panoLocations[currentPanoLoc].name + '" direset');
  } catch (e) { showToast('⚠ ' + e.message); }
}

document.getElementById('panoFileInput')
  .addEventListener('change', e => handlePanoFile(e.target.files[0]));

// Drag & drop — panorama
const pa = document.getElementById('panoUploadArea');
pa.addEventListener('dragover', e => { e.preventDefault(); pa.classList.add('drag-over'); });
pa.addEventListener('dragleave', ()  => pa.classList.remove('drag-over'));
pa.addEventListener('drop', e => {
  e.preventDefault(); pa.classList.remove('drag-over');
  handlePanoFile(e.dataTransfer.files[0]);
});

window.selectPanoLoc = selectPanoLoc;
window.savePano      = savePano;
window.resetPano     = resetPano;


// ============================================================
// SETTINGS — Kredensial
// ============================================================
async function saveCredentials() {
  const u = document.getElementById('newUser').value.trim();
  const p = document.getElementById('newPass').value;
  const c = document.getElementById('confPass').value;
  if (!u || !p) { showToast('⚠ Username dan password wajib diisi!'); return; }
  if (p !== c)  { showToast('⚠ Password tidak cocok!'); return; }
  try {
    await setDoc(doc(db, 'admin_settings', 'credentials'), { username: u, password: p });
    localStorage.setItem('admin_user', u);
    localStorage.setItem('admin_pass', p);
    showToast('✅ Kredensial berhasil diperbarui!');
  } catch (e) { showToast('⚠ Gagal simpan: ' + e.message); }
}
window.saveCredentials = saveCredentials;


// ============================================================
// CLOCK
// ============================================================
function updateAdminClock() {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const clockEl = document.getElementById('adminClock');
  if (clockEl) {
    clockEl.innerHTML = `<div>${dateStr}</div><div style="font-size:1.5rem;color:#fff;font-weight:700">${timeStr}</div>`;
  }
  document.querySelectorAll('.last-updated').forEach(el => {
    el.innerText = `${dateStr} | ${timeStr}`;
  });
}
setInterval(updateAdminClock, 1000);
updateAdminClock();


// ============================================================
// INIT
// ============================================================
(async () => {
  await loadAllPanoFromDB();
  await loadHeroPreview();
  await updateDashboardStats();
})();
}