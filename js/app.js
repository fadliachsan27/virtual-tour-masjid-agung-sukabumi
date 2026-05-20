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
const isPublicGalleryPage = !!document.getElementById('galeriGroups');
const isHomePage = !!document.getElementById('hero-panorama');

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
  return false;
}
window.showPage = showPage;

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
      <button class="btn-danger" style="padding:6px 10px" onclick="deleteFiturRow(${i})">🗑</button>
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
  if (!confirm('Hapus pengurus ini?')) return;
  try {
    await deleteDoc(doc(db, 'pengurus', id));
    await loadPengurus();
    showToast('🗑 Pengurus dihapus');
  } catch (e) { showToast('⚠ ' + e.message); }
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
          <td><button class="btn-danger" onclick="deleteImamRow(${i})">🗑</button></td>
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
          <td><button class="btn-danger" onclick="deleteMuadzinRow(${i})">🗑</button></td>
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
  if (!confirm('Hapus foto ini?')) return;
  await deleteDoc(doc(db, 'galeri', id));
  await loadGaleri();
  showToast('🗑 Foto dihapus');
}

async function confirmClearGaleri() {
  if (!confirm('Hapus SEMUA foto dari galeri?')) return;
  const snap  = await getDocs(collection(db, 'galeri'));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
  await loadGaleri();
  showToast('🗑 Semua foto galeri dihapus');
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

} else if (isPublicGalleryPage) {
  // Theme
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  });
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  // ===== Galeri dari Firestore (Base64) =====
  let galeriSrcs = [], lightboxIdx = 0;

  async function loadAndRenderGaleriPublic() {
    const groupsContainer = document.getElementById('galeriGroups');
    if (!groupsContainer) return;
    try {
      const snap = await getDocs(query(collection(db, 'galeri'), orderBy('order', 'asc')));
      if (snap.empty) { renderEmptyPublic(groupsContainer); return; }
      groupsContainer.innerHTML = '';
      galeriSrcs = [];
      const fotoLuar = [], fotoDalam = [];
      snap.forEach(d => {
        const item = d.data();
        if (!item.base64) return;
        if (item.kategori === 'dalam') fotoDalam.push(item);
        else fotoLuar.push(item);
      });
      if (fotoLuar.length === 0 && fotoDalam.length === 0) { renderEmptyPublic(groupsContainer); return; }

      const totalFoto = fotoLuar.length + fotoDalam.length;
      let startIndex = 0;
      startIndex = renderGroupPublic(groupsContainer, 'Foto Bagian Luar', fotoLuar, startIndex, totalFoto);
      renderGroupPublic(groupsContainer, 'Foto Bagian Dalam', fotoDalam, startIndex, totalFoto);
    } catch (e) {
      renderEmptyPublic(groupsContainer);
      console.error(e);
    }
  }

  function renderGroupPublic(container, title, items, startIndex, totalFoto) {
    const group = document.createElement('div');
    group.className = 'galeri-group';
    group.innerHTML = `<h3 class="galeri-group-title">${title}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'galeri-grid';
    if (items.length === 0) {
      grid.innerHTML = '<div class="galeri-empty" style="padding:30px 20px"><div class="galeri-empty-sub">Belum ada foto pada kategori ini.</div></div>';
      group.appendChild(grid);
      container.appendChild(group);
      return startIndex;
    }
    items.forEach((item, localIndex) => {
      galeriSrcs.push(item.base64);
      const idx = galeriSrcs.length - 1;
      const el = document.createElement('div');
      el.className = 'galeri-item';
      el.onclick = () => openLightboxPublic(idx);
      el.innerHTML = `<img src="${item.base64}" alt="${title}" loading="lazy"/>
      <div class="galeri-item-num">${startIndex + localIndex + 1} / ${totalFoto}</div>`;
      grid.appendChild(el);
    });
    group.appendChild(grid);
    container.appendChild(group);
    return startIndex + items.length;
  }

  function renderEmptyPublic(container) {
    container.innerHTML = '<div class="galeri-empty"><div class="galeri-empty-icon">🖼️</div><div class="galeri-empty-title">Belum Ada Foto</div><div class="galeri-empty-sub">Silakan masukkan foto melalui <a href="admin/login.html" style="color:var(--gold)">Admin Panel</a>.</div></div>';
  }

  function openLightboxPublic(idx) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    if (!lightbox || !lightboxImg || !counter) return;
    lightboxIdx = idx;
    lightboxImg.src = galeriSrcs[idx];
    lightbox.classList.add('active');
    counter.textContent = (idx + 1) + ' / ' + galeriSrcs.length;
  }

  window.closeLightbox = () => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) lightbox.classList.remove('active');
  };

  window.lightboxNav = (dir) => {
    const lightboxImg = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    if (!lightboxImg || !counter || galeriSrcs.length === 0) return;
    lightboxIdx = (lightboxIdx + dir + galeriSrcs.length) % galeriSrcs.length;
    lightboxImg.src = galeriSrcs[lightboxIdx];
    counter.textContent = (lightboxIdx + 1) + ' / ' + galeriSrcs.length;
  };

  document.addEventListener('keydown', e => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'ArrowLeft')  window.lightboxNav(-1);
    if (e.key === 'ArrowRight') window.lightboxNav(1);
    if (e.key === 'Escape')     window.closeLightbox();
  });

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', e => {
      if (e.target === e.currentTarget) window.closeLightbox();
    });
  }

  loadAndRenderGaleriPublic();
} else if (isHomePage) {
  // ===== Hero Panorama =====
  function startHero(src) {
    pannellum.viewer('hero-panorama', {
      type: 'equirectangular', panorama: src, autoLoad: true,
      autoRotate: -2, showControls: false, compass: false,
      mouseZoom: false, hfov: 100, pitch: 0, yaw: 0,
    });
  }

  // ===== Informasi Masjid =====
  async function loadMasjidInfoHome() {
    try {
      const [infoSnap, fiturSnap] = await Promise.all([
        getDoc(doc(db, 'masjid_info', 'info')),
        getDoc(doc(db, 'masjid_info', 'fitur'))
      ]);
      if (infoSnap.exists()) {
        const d = infoSnap.data();
        if (d.judul && document.getElementById('tentangJudul')) document.getElementById('tentangJudul').textContent = d.judul;
        if (d.deskripsi && document.getElementById('tentangDeskripsi')) {
          document.getElementById('tentangDeskripsi').innerHTML = d.deskripsi
            .split('\n\n')
            .filter(Boolean)
            .map(p => `<p>${p}</p>`)
            .join('');
        }
        if (d.kapasitas && document.getElementById('statKapasitas')) document.getElementById('statKapasitas').textContent = d.kapasitas;
        if (d.berdiri && document.getElementById('statBerdiri')) document.getElementById('statBerdiri').textContent = d.berdiri;
        if (d.luas && document.getElementById('statLuas')) document.getElementById('statLuas').textContent = d.luas;
        if (d.menara && document.getElementById('statMenara')) document.getElementById('statMenara').textContent = d.menara;
      }
      if (fiturSnap.exists()) {
        const items = fiturSnap.data().items || [];
        if (items.length > 0 && document.getElementById('tentangFitur')) {
          document.getElementById('tentangFitur').innerHTML = items.map(f => `
            <div class="tentang-feature">
              <div class="tentang-feature-icon">${f.icon || '🕌'}</div>
              <div><div class="tentang-feature-title">${f.judul}</div><div class="tentang-feature-desc">${f.deskripsi}</div></div>
            </div>`).join('');
        }
      }
    } catch (e) { console.error('loadMasjidInfo:', e); }
  }

  // ===== Pengurus =====
  async function loadPengurusHome() {
    try {
      const snap = await getDocs(query(collection(db, 'pengurus'), orderBy('order', 'asc')));
      if (snap.empty) return;
      const slider = document.getElementById('pengurusSlider');
      if (!slider) return;
      slider.innerHTML = '';
      snap.forEach(d => {
        const item = d.data();
        const card = document.createElement('div'); card.className = 'pengurus-card';
        const avatarHtml = item.fotoBase64
          ? `<img class="pengurus-avatar" src="${item.fotoBase64}" alt="${item.nama}"/>`
          : `<div class="pengurus-avatar-placeholder">👤</div>`;
        card.innerHTML = `${avatarHtml}
          <div class="pengurus-jabatan">${item.jabatan || 'Pengurus'}</div>
          <div class="pengurus-nama">${item.nama || '-'}</div>
          <div class="pengurus-periode">${item.periode || ''}</div>`;
        slider.appendChild(card);
      });
    } catch (e) { console.error('loadPengurus:', e); }
  }

  // ===== Imam & Muadzin =====
  async function loadImamMuadzinHome() {
    try {
      const snap = await getDoc(doc(db, 'imam_muadzin', 'jadwal'));
      if (!snap.exists()) return;
      const data = snap.data();
      const renderList = (items, elId) => {
        if (!items || !items.length) return;
        const el = document.getElementById(elId); if (!el) return;
        el.innerHTML = items.map(item => `
          <div class="imam-item">
            <div class="imam-hari-badge">${item.hari}</div>
            <div class="imam-nama-col">
              <div class="imam-nama">${item.nama}</div>
              ${item.keterangan ? `<div class="imam-keterangan">${item.keterangan}</div>` : ''}
            </div>
          </div>`).join('');
      };
      renderList(data.imam, 'imamList');
      renderList(data.muadzin, 'muadzinList');
    } catch (e) { console.error('loadImamMuadzin:', e); }
  }

  // ===== Theme + Nav =====
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  });
  window.slideLeft = () => document.getElementById('pengurusSlider')?.scrollBy({ left: -240, behavior: 'smooth' });
  window.slideRight = () => document.getElementById('pengurusSlider')?.scrollBy({ left: 240, behavior: 'smooth' });

  // ===== Prayer Times Realtime WIB =====
  async function getPrayerTimesHome() {
    try {
      const cityId = '1301';
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;

      const response = await fetch(url);
      const result = await response.json();
      if (!result.status) return;

      const d = result.data.jadwal;
      document.getElementById('imsakTime').textContent = d.imsak;
      document.getElementById('subuhTime').textContent = d.subuh;
      document.getElementById('terbitTime').textContent = d.terbit;
      document.getElementById('dzuhurTime').textContent = d.dzuhur;
      document.getElementById('asharTime').textContent = d.ashar;
      document.getElementById('maghribTime').textContent = d.maghrib;
      document.getElementById('isyaTime').textContent = d.isya;
    } catch (e) {
      console.error('Prayer times error:', e);
    }
  }

  setInterval(getPrayerTimesHome, 3600000);

  function updateFooterClockHome() {
    const clock = document.getElementById('footerClock');
    if (!clock) return;
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    clock.textContent = time + ' WIB';
  }

  setInterval(updateFooterClockHome, 1000);
  updateFooterClockHome();

  // ===== Quotes Of The Day =====
  const quotes = [
    { text: 'Sesungguhnya bersama kesulitan ada kemudahan.', source: 'QS. Al-Insyirah: 6' },
    { text: 'Dan bersabarlah. Sesungguhnya Allah beserta orang-orang yang sabar.', source: 'QS. Al-Anfal: 46' },
    { text: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.', source: 'HR. Ahmad' },
    { text: 'Janganlah kamu berputus asa dari rahmat Allah.', source: 'QS. Az-Zumar: 53' },
    { text: 'Sesungguhnya Allah tidak melihat rupa kalian, tetapi melihat hati dan amal kalian.', source: 'HR. Muslim' }
  ];

  function loadQuoteOfTheDay() {
    const today = new Date().getDate();
    const quote = quotes[today % quotes.length];
    const quoteText = document.getElementById('quoteText');
    const quoteSource = document.getElementById('quoteSource');
    if (quoteText) quoteText.textContent = `“${quote.text}”`;
    if (quoteSource) quoteSource.textContent = `— ${quote.source}`;
  }

  // ===== INIT =====
  (async () => {
    try {
      const panoSnap = await getDoc(doc(db, 'panorama', 'hero_bg'));
      const heroSrc = panoSnap.exists() && panoSnap.data().base64 ? panoSnap.data().base64 : 'images/hero-360.png';
      startHero(heroSrc);
    } catch (e) { startHero('images/hero-360.png'); }
    await Promise.all([loadMasjidInfoHome(), loadPengurusHome(), loadImamMuadzinHome()]);
    getPrayerTimesHome();
    loadQuoteOfTheDay();
  })();
}