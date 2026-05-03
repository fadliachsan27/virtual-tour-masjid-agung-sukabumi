/* ============================================================
   main.js — Masjid Al-Nuur Virtual Tour
   ============================================================ */

// =================== STATE ===================
let currentUser        = null;
let currentLoginTab    = 'user';
let currentAdminTab    = 'dashboard';
let currentSpotIndex   = 0;
let pannellumViewer    = null;

// =================== DATA (simulasi backend) ===================
let mosqueData = {
  nama:      'Masjid Al-Nuur',
  tagline:   'Rasakan pengalaman spiritual yang mendalam melalui tur virtual 360° yang memukau. Jelajahi setiap sudut masjid bersejarah kami dari mana saja di seluruh dunia.',
  profil:    'Masjid Al-Nuur berdiri megah sebagai pusat spiritual dan kebudayaan Islam di jantung kota. Dibangun pada tahun 1965, masjid ini telah menjadi saksi bisu perjalanan panjang umat Islam di daerah ini selama lebih dari setengah abad.',
  profil2:   'Dengan arsitektur yang memadukan gaya Timur Tengah dan kearifan lokal, Masjid Al-Nuur tidak hanya berfungsi sebagai tempat ibadah, tetapi juga sebagai pusat pendidikan dan kegiatan sosial masyarakat.',
  alamat:    'Jl. Raya Masjid No. 1, Kota',
  telepon:   '(021) 1234-5678',
  email:     'info@masjidalnuur.id',
  kapasitas: '5.000',
  berdiri:   '1965',
  imam:      'Ust. Ahmad Fauzi, Lc.',
};

let spotsData = [
  {
    id: 1, name: 'Ruang Utama (Mihrab)', tag: 'Area Shalat Utama',
    emoji: '🕌', bg: 'spot-thumb-main',
    desc: 'Pusat ibadah dengan mihrab megah dan kubah utama yang indah. Area ini dapat menampung ribuan jamaah.',
    panoUrl: 'https://pannellum.org/images/cerro-toco-0.jpg',
    active: true,
  },
  {
    id: 2, name: 'Aula & Selasar', tag: 'Area Multifungsi',
    emoji: '🏛️', bg: 'spot-thumb-hall',
    desc: 'Ruang multifungsi untuk kegiatan pendidikan, seminar, dan pertemuan komunitas masjid.',
    panoUrl: 'https://pannellum.org/images/cerro-toco-0.jpg',
    active: true,
  },
  {
    id: 3, name: 'Halaman & Taman', tag: 'Area Luar Masjid',
    emoji: '🌿', bg: 'spot-thumb-courtyard',
    desc: 'Halaman yang luas dengan taman yang asri, kolam wudhu, dan area istirahat yang nyaman.',
    panoUrl: 'https://pannellum.org/images/cerro-toco-0.jpg',
    active: true,
  },
  {
    id: 4, name: 'Menara & Kubah', tag: 'Landmark Masjid',
    emoji: '🗼', bg: 'spot-thumb-minaret',
    desc: 'Menara setinggi 45 meter yang menjadi ikon dan landmark kebanggaan masjid dan masyarakat sekitar.',
    panoUrl: 'https://pannellum.org/images/cerro-toco-0.jpg',
    active: true,
  },
];

let galleryData = [
  { emoji: '🕌', bg: 'linear-gradient(135deg,#1B4332,#2D6A4F)', label: 'Tampak Depan' },
  { emoji: '🌙', bg: 'linear-gradient(135deg,#1e3a5f,#1e40af)', label: 'Malam Hari' },
  { emoji: '🏛️', bg: 'linear-gradient(135deg,#4a2c0a,#92400e)', label: 'Interior Utama' },
  { emoji: '🌿', bg: 'linear-gradient(135deg,#14532d,#166534)', label: 'Taman & Halaman' },
  { emoji: '🗼', bg: 'linear-gradient(135deg,#1a1040,#4c1d95)', label: 'Menara Masjid' },
  { emoji: '✨', bg: 'linear-gradient(135deg,#431407,#9a3412)', label: 'Detail Ornamen' },
];

const accounts = {
  user:  { username: 'pengunjung', password: '12345',    role: 'user'  },
  admin: { username: 'admin',      password: 'admin123', role: 'admin' },
};

// =================== NAVIGASI HALAMAN ===================
function showPage(id) {
  // Jika coba akses admin tanpa login sebagai admin, redirect ke login
  if (id === 'admin' && (!currentUser || currentUser.role !== 'admin')) {
    showPage('login');
    return;
  }

  // Sembunyikan semua halaman
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Tampilkan halaman yang dipilih
  document.getElementById(id).classList.add('active');

  // Update state nav-btn aktif
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (id === 'home')         document.querySelector('.nav-btn').classList.add('active');

  // Inisialisasi halaman tertentu
  if (id === 'tour')  renderTourPage();
  if (id === 'admin') renderAdminContent();
  renderAll();

  window.scrollTo(0, 0);
}

function scrollToInfo() {
  document.getElementById('info-section').scrollIntoView({ behavior: 'smooth' });
}

// =================== LOGIN ===================
function switchLoginTab(tab) {
  currentLoginTab = tab;
  document.querySelectorAll('.login-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'user') || (i === 1 && tab === 'admin'));
  });
  document.getElementById('login-error').classList.remove('show');
}

function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const errorEl  = document.getElementById('login-error');

  // Reset pesan error
  errorEl.textContent = 'Username atau password salah';
  errorEl.classList.remove('show');

  const acc = Object.values(accounts).find(
    a => a.username === username && a.password === password
  );

  if (!acc) {
    errorEl.classList.add('show');
    return;
  }

  if (currentLoginTab === 'admin' && acc.role !== 'admin') {
    errorEl.textContent = 'Akun ini bukan admin';
    errorEl.classList.add('show');
    return;
  }

  // Login berhasil
  currentUser = acc;

  if (acc.role === 'admin') {
    document.getElementById('admin-username-display').textContent = acc.username;
    document.querySelector('.nav-cta').textContent = '⚙ Admin Panel';
    document.querySelector('.nav-cta').onclick = () => showPage('admin');
    showPage('admin');
  } else {
    document.querySelector('.nav-cta').textContent = acc.username + ' ▸';
    showPage('home');
  }
}

function doLogout() {
  currentUser = null;
  document.querySelector('.nav-cta').textContent = 'Login Admin';
  document.querySelector('.nav-cta').onclick = () => showPage('login');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  showPage('home');
}

// =================== RENDER BERANDA ===================
function renderAll() {
  renderSpots();
  renderInfoItems();
  renderGalleryScroll();
  renderGalleryPage();

  // Sinkronisasi data mosqueData ke elemen DOM
  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  safeSet('hero-desc',       mosqueData.tagline);
  safeSet('profil-text',     mosqueData.profil);
  safeSet('profil-text2',    mosqueData.profil2);
  safeSet('footer-alamat',   mosqueData.alamat);
  safeSet('stat-kapasitas',  mosqueData.kapasitas);
  safeSet('stat-berdiri',    mosqueData.berdiri);
}

function renderSpots() {
  const grid = document.getElementById('spots-grid');
  if (!grid) return;

  grid.innerHTML = spotsData
    .filter(s => s.active)
    .map((s, i) => `
      <div class="spot-card fade-in fade-in-delay-${(i % 3) + 1}" onclick="openTourAt(${i})">
        <div class="spot-thumb ${s.bg}">
          <span style="font-size:70px;filter:drop-shadow(0 4px 20px rgba(0,0,0,0.5))">${s.emoji}</span>
          <div class="spot-overlay"></div>
          <div class="spot-badge">360°</div>
        </div>
        <div class="spot-info">
          <div class="spot-name">${s.name}</div>
          <div class="spot-desc">${s.desc}</div>
          <div class="spot-action">
            <div class="spot-arrow">▶</div> Buka Virtual Tour
          </div>
        </div>
      </div>
    `)
    .join('');
}

function renderInfoItems() {
  const container = document.getElementById('info-items');
  if (!container) return;

  const items = [
    { icon: '📍', title: 'Alamat',       val: mosqueData.alamat },
    { icon: '📞', title: 'Telepon',      val: mosqueData.telepon },
    { icon: '📧', title: 'Email',        val: mosqueData.email },
    { icon: '🤲', title: 'Imam Masjid',  val: mosqueData.imam },
  ];

  container.innerHTML = items.map(it => `
    <div class="info-item">
      <div class="info-icon">${it.icon}</div>
      <div>
        <div class="info-item-title">${it.title}</div>
        <div class="info-item-val">${it.val}</div>
      </div>
    </div>
  `).join('');
}

function renderGalleryScroll() {
  const container = document.getElementById('gallery-scroll');
  if (!container) return;

  container.innerHTML = galleryData.map(g => `
    <div class="gallery-item">
      <div class="gallery-item-inner" style="background:${g.bg}">${g.emoji}</div>
      <div class="gallery-item-label">${g.label}</div>
    </div>
  `).join('');
}

function renderGalleryPage() {
  const container = document.getElementById('gallery-page-grid');
  if (!container) return;

  container.innerHTML = galleryData.map(g => `
    <div class="gallery-page-item">
      <div class="inner" style="background:${g.bg}">${g.emoji}</div>
      <div class="label">${g.label}</div>
    </div>
  `).join('');
}

// =================== VIRTUAL TOUR ===================
function openTourAt(idx) {
  currentSpotIndex = idx;
  showPage('tour');
}

function renderTourPage() {
  const list = document.getElementById('tour-spot-list');
  if (!list) return;

  list.innerHTML = spotsData
    .filter(s => s.active)
    .map((s, i) => `
      <button class="tour-spot-btn ${i === currentSpotIndex ? 'active' : ''}" onclick="loadSpot(${i})">
        <div class="tour-spot-icon" style="background:rgba(201,168,76,0.12)">${s.emoji}</div>
        <div>
          <div class="tour-spot-name">${s.name}</div>
          <div class="tour-spot-tag">${s.tag}</div>
        </div>
      </button>
    `)
    .join('');

  loadSpot(currentSpotIndex);
}

function loadSpot(idx) {
  currentSpotIndex = idx;
  const activeSpots = spotsData.filter(s => s.active);
  const spot = activeSpots[idx];
  if (!spot) return;

  // Update active state tombol sidebar
  document.querySelectorAll('.tour-spot-btn').forEach((b, i) =>
    b.classList.toggle('active', i === idx)
  );

  // Update info panel
  document.getElementById('tip-name').textContent = spot.name;
  document.getElementById('tip-desc').textContent = spot.desc;

  // Tampilkan loading
  document.getElementById('tour-loading').style.display = 'flex';

  setTimeout(() => {
    try {
      if (pannellumViewer) {
        pannellumViewer.destroy();
        pannellumViewer = null;
      }

      pannellumViewer = pannellum.viewer('pannellum-container', {
        type:         'equirectangular',
        panorama:     spot.panoUrl,
        autoLoad:     true,
        autoRotate:   -2,
        compass:      false,
        showControls: true,
        hfov:         100,
        minHfov:      50,
        maxHfov:      120,
        mouseZoom:    true,
      });

      pannellumViewer.on('load', () => {
        document.getElementById('tour-loading').style.display = 'none';
      });

      // Fallback: sembunyikan loading setelah 3 detik
      setTimeout(() => {
        document.getElementById('tour-loading').style.display = 'none';
      }, 3000);

    } catch (err) {
      console.error('Pannellum error:', err);
      document.getElementById('tour-loading').style.display = 'none';
    }
  }, 300);
}

function nextSpot() {
  const active = spotsData.filter(s => s.active);
  loadSpot((currentSpotIndex + 1) % active.length);
}

function prevSpot() {
  const active = spotsData.filter(s => s.active);
  loadSpot((currentSpotIndex - 1 + active.length) % active.length);
}

// =================== ADMIN ===================
function switchAdmin(tab) {
  currentAdminTab = tab;
  const tabs = ['dashboard', 'info', 'spots', 'gallery'];
  document.querySelectorAll('.admin-menu-item').forEach((b, i) => {
    b.classList.toggle('active', tabs[i] === tab);
  });
  renderAdminContent();
}

function renderAdminContent() {
  const container = document.getElementById('admin-content');
  if (!container) return;

  const renderers = {
    dashboard: renderAdminDashboard,
    info:      renderAdminInfo,
    spots:     renderAdminSpots,
    gallery:   renderAdminGallery,
  };

  container.innerHTML = (renderers[currentAdminTab] || renderAdminDashboard)();
}

// --- Dashboard ---
function renderAdminDashboard() {
  return `
    <h2 class="admin-page-title">Dashboard</h2>
    <p class="admin-page-sub">Ringkasan konten website Masjid Al-Nuur</p>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px">
      <div style="background:var(--dark2);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;text-align:center">
        <div style="font-size:32px;color:var(--gold);font-family:'Playfair Display',serif">${spotsData.filter(s => s.active).length}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:1px">Titik Virtual Tour</div>
      </div>
      <div style="background:var(--dark2);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;text-align:center">
        <div style="font-size:32px;color:var(--gold);font-family:'Playfair Display',serif">${galleryData.length}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:1px">Foto Galeri</div>
      </div>
      <div style="background:var(--dark2);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;text-align:center">
        <div style="font-size:32px;color:var(--gold);font-family:'Playfair Display',serif">2</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:1px">Akun Terdaftar</div>
      </div>
    </div>

    <h3 style="font-size:16px;margin-bottom:16px;color:var(--text-muted)">Aksi Cepat</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <button class="btn-save" onclick="switchAdmin('info')">✏️ Edit Info Masjid</button>
      <button class="btn-save" onclick="switchAdmin('spots')">📍 Kelola Titik Tour</button>
    </div>
  `;
}

// --- Info Masjid ---
function renderAdminInfo() {
  return `
    <h2 class="admin-page-title">Info Masjid</h2>
    <p class="admin-page-sub">Edit informasi yang tampil di halaman utama</p>
    <div class="alert-success" id="info-saved">✅ Perubahan berhasil disimpan!</div>

    <div class="form-group">
      <label class="form-label">Nama Masjid</label>
      <input class="form-input" id="f-nama" value="${mosqueData.nama}">
    </div>
    <div class="form-group">
      <label class="form-label">Tagline / Deskripsi Hero</label>
      <textarea class="form-textarea" id="f-tagline">${mosqueData.tagline}</textarea>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Tahun Berdiri</label>
        <input class="form-input" id="f-berdiri" value="${mosqueData.berdiri}">
      </div>
      <div class="form-group">
        <label class="form-label">Kapasitas Jamaah</label>
        <input class="form-input" id="f-kapasitas" value="${mosqueData.kapasitas}">
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Alamat</label>
        <input class="form-input" id="f-alamat" value="${mosqueData.alamat}">
      </div>
      <div class="form-group">
        <label class="form-label">Telepon</label>
        <input class="form-input" id="f-telepon" value="${mosqueData.telepon}">
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="f-email" value="${mosqueData.email}">
      </div>
      <div class="form-group">
        <label class="form-label">Nama Imam</label>
        <input class="form-input" id="f-imam" value="${mosqueData.imam}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Profil Masjid (Paragraf 1)</label>
      <textarea class="form-textarea" id="f-profil">${mosqueData.profil}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Profil Masjid (Paragraf 2)</label>
      <textarea class="form-textarea" id="f-profil2">${mosqueData.profil2}</textarea>
    </div>
    <button class="btn-save" onclick="saveInfo()">💾 Simpan Perubahan</button>
  `;
}

function saveInfo() {
  mosqueData.nama      = document.getElementById('f-nama').value;
  mosqueData.tagline   = document.getElementById('f-tagline').value;
  mosqueData.berdiri   = document.getElementById('f-berdiri').value;
  mosqueData.kapasitas = document.getElementById('f-kapasitas').value;
  mosqueData.alamat    = document.getElementById('f-alamat').value;
  mosqueData.telepon   = document.getElementById('f-telepon').value;
  mosqueData.email     = document.getElementById('f-email').value;
  mosqueData.imam      = document.getElementById('f-imam').value;
  mosqueData.profil    = document.getElementById('f-profil').value;
  mosqueData.profil2   = document.getElementById('f-profil2').value;

  showAlert('info-saved');
}

// --- Titik Virtual Tour ---
function renderAdminSpots() {
  return `
    <h2 class="admin-page-title">Titik Virtual Tour</h2>
    <p class="admin-page-sub">Kelola 4 titik panorama 360° yang tampil di website</p>
    <div class="alert-success" id="spot-saved">✅ Data titik tour diperbarui!</div>

    <div class="spots-admin-grid">
      ${spotsData.map((s, i) => `
        <div class="spot-admin-card">
          <div class="spot-admin-icon" style="background:rgba(201,168,76,0.1)">${s.emoji}</div>
          <div class="spot-admin-info">
            <div class="spot-admin-name">${s.name}</div>
            <div class="spot-admin-status">${s.active ? '✅ Aktif' : '⛔ Nonaktif'} • ${s.tag}</div>
          </div>
          <div class="spot-admin-actions">
            <button class="btn-edit" onclick="editSpot(${i})">✏️ Edit</button>
            <button class="btn-danger" onclick="toggleSpot(${i})">${s.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
          </div>
        </div>

        <div id="spot-edit-${i}" style="display:none;background:var(--dark3);border-radius:12px;padding:20px;margin-top:-8px;border:1px solid rgba(201,168,76,0.2)">
          <div class="form-group">
            <label class="form-label">Nama Titik</label>
            <input class="form-input" id="se-name-${i}" value="${s.name}">
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi</label>
            <textarea class="form-textarea" id="se-desc-${i}" style="min-height:70px">${s.desc}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">URL Panorama 360° (equirectangular image)</label>
            <input class="form-input" id="se-url-${i}" value="${s.panoUrl}" placeholder="https://...">
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-save" onclick="saveSpot(${i})">💾 Simpan</button>
            <button class="btn-edit" onclick="editSpot(${i})">Batal</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function editSpot(i) {
  const el = document.getElementById('spot-edit-' + i);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function saveSpot(i) {
  spotsData[i].name    = document.getElementById('se-name-' + i).value;
  spotsData[i].desc    = document.getElementById('se-desc-' + i).value;
  spotsData[i].panoUrl = document.getElementById('se-url-' + i).value;
  showAlert('spot-saved');
  renderAdminContent();
}

function toggleSpot(i) {
  spotsData[i].active = !spotsData[i].active;
  renderAdminContent();
}

// --- Galeri ---
function renderAdminGallery() {
  return `
    <h2 class="admin-page-title">Kelola Galeri</h2>
    <p class="admin-page-sub">Tambah, edit, atau hapus foto galeri masjid</p>
    <div class="alert-success" id="gallery-saved">✅ Galeri diperbarui!</div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
      ${galleryData.map((g, i) => `
        <div style="background:var(--dark2);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden">
          <div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:40px;background:${g.bg}">${g.emoji}</div>
          <div style="padding:12px">
            <input class="form-input" style="margin-bottom:8px;font-size:13px" id="gl-label-${i}" value="${g.label}" placeholder="Nama foto">
            <div style="display:flex;gap:6px">
              <button class="btn-edit" style="flex:1;font-size:11px" onclick="saveGalleryItem(${i})">💾</button>
              <button class="btn-danger" style="font-size:11px" onclick="deleteGallery(${i})">🗑</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="background:var(--dark2);border:2px dashed rgba(201,168,76,0.3);border-radius:12px;padding:24px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">+</div>
      <div style="font-size:14px;color:var(--text-muted);margin-bottom:16px">Tambah foto baru ke galeri</div>
      <div class="form-grid" style="text-align:left">
        <input class="form-input" id="new-gl-label" placeholder="Nama foto">
        <input class="form-input" id="new-gl-emoji" placeholder="Emoji (mis: 🕌)">
      </div>
      <button class="btn-save" style="margin-top:12px" onclick="addGallery()">+ Tambah Foto</button>
    </div>
  `;
}

function saveGalleryItem(i) {
  galleryData[i].label = document.getElementById('gl-label-' + i).value;
  showAlert('gallery-saved');
  renderAdminContent();
}

function deleteGallery(i) {
  galleryData.splice(i, 1);
  renderAdminContent();
}

function addGallery() {
  const label = document.getElementById('new-gl-label').value.trim();
  const emoji = document.getElementById('new-gl-emoji').value.trim();
  if (!label || !emoji) return;

  const bgOptions = [
    'linear-gradient(135deg,#1B4332,#2D6A4F)',
    'linear-gradient(135deg,#1e3a5f,#1e40af)',
    'linear-gradient(135deg,#4a2c0a,#92400e)',
  ];

  galleryData.push({
    emoji,
    bg: bgOptions[galleryData.length % bgOptions.length],
    label,
  });

  renderAdminContent();

  // Tampilkan alert setelah render ulang
  setTimeout(() => showAlert('gallery-saved'), 100);
}

// =================== UTILITY ===================
function showAlert(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// =================== INIT ===================
renderAll();
document.querySelector('.nav-cta').onclick = () => showPage('login');
