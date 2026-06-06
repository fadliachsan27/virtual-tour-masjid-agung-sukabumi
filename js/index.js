import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6b5hiSH7BWAXOWu3_-cwXtMl6J3sTGxA",
  authDomain: "vt-masjid-agung-sukabumi.firebaseapp.com",
  projectId: "vt-masjid-agung-sukabumi",
  storageBucket: "vt-masjid-agung-sukabumi.firebasestorage.app",
  messagingSenderId: "633933684627",
  appId: "1:633933684627:web:fdcaa9d3ff99475e665266",
  measurementId: "G-GG88GW221Z"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

function startHero(src) {
  pannellum.viewer('hero-panorama', {
    type: 'equirectangular', panorama: src, autoLoad: true,
    autoRotate: -2, showControls: false, compass: false,
    mouseZoom: false, hfov: 100, pitch: 0, yaw: 0,
  });
}

async function loadMasjidInfo() {
  try {
    const [infoSnap, fiturSnap] = await Promise.all([
      getDoc(doc(db, 'masjid_info', 'info')),
      getDoc(doc(db, 'masjid_info', 'fitur'))
    ]);
    if (infoSnap.exists()) {
      const d = infoSnap.data();
      if (d.judul && document.getElementById('tentangJudul')) document.getElementById('tentangJudul').textContent = d.judul;
      if (d.deskripsi && document.getElementById('tentangDeskripsi')) {
        document.getElementById('tentangDeskripsi').innerHTML = d.deskripsi.split('\n\n').filter(Boolean).map(p => `<p>${p}</p>`).join('');
      }
      if (d.kapasitas && document.getElementById('statKapasitas')) document.getElementById('statKapasitas').textContent = d.kapasitas;
      if (d.berdiri && document.getElementById('statBerdiri')) document.getElementById('statBerdiri').textContent = d.berdiri;
      if (d.luas && document.getElementById('statLuas')) document.getElementById('statLuas').textContent = d.luas;
      if (d.menara && document.getElementById('statMenara')) document.getElementById('statMenara').textContent = d.menara;
    }
    if (fiturSnap.exists()) {
      const items = (fiturSnap.data().items) || [];
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

async function loadPengurus() {
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

async function loadImamMuadzin() {
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

const themeBtn = document.getElementById('themeToggle');
if (themeBtn) themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
});
window.slideLeft = () => document.getElementById('pengurusSlider')?.scrollBy({ left: -240, behavior: 'smooth' });
window.slideRight = () => document.getElementById('pengurusSlider')?.scrollBy({ left: 240, behavior: 'smooth' });

async function getPrayerTimes() {
  try {
    const cityId = "1301";
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.status) return;
    const d = result.data.jadwal;
    document.getElementById("imsakTime").textContent = d.imsak;
    document.getElementById("subuhTime").textContent = d.subuh;
    document.getElementById("terbitTime").textContent = d.terbit;
    document.getElementById("dzuhurTime").textContent = d.dzuhur;
    document.getElementById("asharTime").textContent = d.ashar;
    document.getElementById("maghribTime").textContent = d.maghrib;
    document.getElementById("isyaTime").textContent = d.isya;
  } catch (e) {
    console.error("Prayer times error:", e);
  }
}
setInterval(getPrayerTimes, 3600000);

function updateFooterClock() {
  const clock = document.getElementById("footerClock");
  if (!clock) return;
  const now = new Date();
  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  clock.textContent = time + " WIB";
}
setInterval(updateFooterClock, 1000);
updateFooterClock();

const quotes = [
  { text: "Sesungguhnya bersama kesulitan ada kemudahan.", source: "QS. Al-Insyirah: 6" },
  { text: "Dan bersabarlah. Sesungguhnya Allah beserta orang-orang yang sabar.", source: "QS. Al-Anfal: 46" },
  { text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.", source: "HR. Ahmad" },
  { text: "Janganlah kamu berputus asa dari rahmat Allah.", source: "QS. Az-Zumar: 53" },
  { text: "Sesungguhnya Allah tidak melihat rupa kalian, tetapi melihat hati dan amal kalian.", source: "HR. Muslim" }
];

function setQuoteHTML(el, text) {
  if (!el) return;
  const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  el.innerHTML = safe.replace(/\n/g, '<br>');
}

async function loadQuoteOfTheDay() {
  const hariKeys = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const todayHari = hariKeys[new Date().getDay()];
  const quoteText   = document.getElementById('quoteText');
  const quoteSource = document.getElementById('quoteSource');

  try {
    const snap = await getDoc(doc(db, 'quotes_of_day', 'quotes'));
    if (snap.exists()) {
      const q = snap.data()[todayHari];
      if (q && q.text) {
        setQuoteHTML(quoteText, `“${q.text}”`);
        if (quoteSource) quoteSource.textContent = q.source ? `— ${q.source}` : '';
        return;
      }
    }
  } catch (e) { /* fallback ke quotes statis */ }

  const today = new Date().getDate();
  const quote = quotes[today % quotes.length];
  setQuoteHTML(quoteText, `“${quote.text}”`);
  if (quoteSource) quoteSource.textContent = `— ${quote.source}`;
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

function getEventCountdown(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const today = new Date();
  const eventDate = new Date(year, month - 1, day);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.ceil((eventDate - startOfToday) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return `${diffDays} Hari Lagi`;
  if (diffDays === 1) return '1 Hari Lagi';
  if (diffDays === 0) return 'Hari Ini';
  return 'Selesai';
}

function getEventStatus(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { label: 'Mendatang', className: 'upcoming' };
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const today = new Date();
  const eventDate = new Date(year, month - 1, day);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = eventDate.getTime() - startOfToday.getTime();
  if (diffTime < 0) {
    return { label: 'Selesai', className: 'done' };
  } else if (diffTime === 0) {
    return { label: 'Hari Ini', className: 'today' };
  } else {
    return { label: 'Mendatang', className: 'upcoming' };
  };
}

const EVENTS_PER_PAGE = 8;
const ARTICLES_PER_PAGE = 6;
let eventItems = [];
let eventPage = 1;
let articleItems = [];
let articlePage = 1;
const articleCarouselIndexes = {};
let currentArticleDetailId = null;
let currentArticleDetailIndex = 0;

function renderEventList() {
  const el = document.getElementById('eventList');
  if (!el) return;
  const totalPages = Math.max(1, Math.ceil(eventItems.length / EVENTS_PER_PAGE));
  if (eventPage > totalPages) eventPage = totalPages;
  const pageItems = eventItems.slice((eventPage - 1) * EVENTS_PER_PAGE, eventPage * EVENTS_PER_PAGE);
  if (!pageItems.length) {
    el.innerHTML = `
      <div class="event-empty">
        <div class="event-empty-icon">📅</div>
        <div>Belum ada event terdekat. <a href="admin/index.html" style="color:var(--gold)">Tambah di Admin Panel</a></div>
      </div>`;
  } else {
    el.innerHTML = pageItems.map(item => {
      let mediaHtml = '';
      const status = getEventStatus(item.tanggal);
      if (item.mediaBase64) {
        if (item.mediaType === 'video') {
          mediaHtml = `
            <div class="event-media">
              <span class="event-media-badge ${status.className}">${status.label}</span>
              <video src="${item.mediaBase64}" controls playsinline preload="metadata"></video>
            </div>`;
        } else {
          mediaHtml = `
            <div class="event-media">
              <span class="event-media-badge ${status.className}">${status.label}</span>
              <img src="${item.mediaBase64}" alt="${item.judul || 'Event'}" loading="lazy"/>
            </div>`;
        }
      }
      const countdownText = getEventCountdown(item.tanggal);
      const summaryText = item.deskripsi
        ? (item.deskripsi.length > 120 ? item.deskripsi.slice(0, 120).trim() + '...' : item.deskripsi)
        : '-';
      return `
        <div class="event-card" onclick="openEventDetail('${item.id}')">
          ${mediaHtml}
          <div class="event-content">
            <h3 class="event-title">${item.judul || '-'}</h3>
            <p class="event-desc">${summaryText}</p>
            <div class="event-meta">
              <div class="event-date">
                <span>📅</span> ${formatIndonesianDate(item.tanggal)}
              </div>
              <div class="event-countdown">${countdownText}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }
  renderEventPagination(totalPages);
}

function renderEventPagination(totalPages) {
  const el = document.getElementById('eventPagination');
  if (!el) return;
  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <div class="pagination-shell">
      <button class="pagination-btn" aria-label="Halaman sebelumnya" ${eventPage === 1 ? 'disabled' : ''} onclick="changeEventPage(${eventPage - 1})">&lt;</button>
      <span class="pagination-status">${eventPage}<span>/</span>${totalPages}</span>
      <button class="pagination-btn" aria-label="Halaman berikutnya" ${eventPage === totalPages ? 'disabled' : ''} onclick="changeEventPage(${eventPage + 1})">&gt;</button>
    </div>`;
}

function scrollToContentSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeEventPage(page) {
  const totalPages = Math.max(1, Math.ceil(eventItems.length / EVENTS_PER_PAGE));
  if (page < 1 || page > totalPages) return;
  eventPage = page;
  renderEventList();
  requestAnimationFrame(() => scrollToContentSection('events'));
}
window.changeEventPage = changeEventPage;

function renderArticleList() {
  const el = document.getElementById('articleList');
  if (!el) return;
  const totalPages = Math.max(1, Math.ceil(articleItems.length / ARTICLES_PER_PAGE));
  if (articlePage > totalPages) articlePage = totalPages;
  const pageItems = articleItems.slice((articlePage - 1) * ARTICLES_PER_PAGE, articlePage * ARTICLES_PER_PAGE);
  if (!pageItems.length) {
    el.innerHTML = `
      <div class="article-empty">
        <div class="article-empty-icon">📰</div>
        <div>Belum ada artikel terbaru. <a href="admin/index.html" style="color:var(--gold)">Tambah di Admin Panel</a></div>
      </div>`;
  } else {
    el.innerHTML = pageItems.map(item => {
      const images = Array.isArray(item.images) ? item.images : [];
      const index = articleCarouselIndexes[item.id] ?? 0;
      const safeIndex = images.length ? Math.min(Math.max(0, index), images.length - 1) : 0;
      const imageSrc = images.length ? images[safeIndex] : 'https://via.placeholder.com/640x360?text=Tidak+ada+gambar';
      const summaryText = item.deskripsi
        ? (item.deskripsi.length > 120 ? item.deskripsi.slice(0, 120).trim() + '...' : item.deskripsi)
        : '-';
      return `
        <div class="article-card" onclick="openArticleDetail('${item.id}')">
          <div class="article-media">
            <img src="${imageSrc}" alt="${item.judul || 'Artikel'}" loading="lazy"/>
            ${images.length > 1 ? `
              <button class="article-carousel-btn prev" onclick="event.stopPropagation(); changeArticleCardImage('${item.id}', -1)">‹</button>
              <button class="article-carousel-btn next" onclick="event.stopPropagation(); changeArticleCardImage('${item.id}', 1)">›</button>
              <div class="article-carousel-index">${safeIndex + 1}/${images.length}</div>
            ` : ''}
          </div>
          <div class="article-content">
            <h3 class="article-title">${item.judul || '-'}</h3>
            <p class="article-snippet">${summaryText}</p>
            <div class="article-meta">
              <span class="article-date">📅 ${formatTimestamp(item.createdAt)}</span>
              <span>${item.images?.length || 0} gambar</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }
  renderArticlePagination(totalPages);
}

function renderArticlePagination(totalPages) {
  const el = document.getElementById('articlePagination');
  if (!el) return;
  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <div class="pagination-shell">
      <button class="pagination-btn" aria-label="Halaman sebelumnya" ${articlePage === 1 ? 'disabled' : ''} onclick="changeArticlePage(${articlePage - 1})">&lt;</button>
      <span class="pagination-status">${articlePage}<span>/</span>${totalPages}</span>
      <button class="pagination-btn" aria-label="Halaman berikutnya" ${articlePage === totalPages ? 'disabled' : ''} onclick="changeArticlePage(${articlePage + 1})">&gt;</button>
    </div>`;
}

function changeArticlePage(page) {
  const totalPages = Math.max(1, Math.ceil(articleItems.length / ARTICLES_PER_PAGE));
  if (page < 1 || page > totalPages) return;
  articlePage = page;
  renderArticleList();
  requestAnimationFrame(() => scrollToContentSection('articles'));
}
window.changeArticlePage = changeArticlePage;

function changeArticleCardImage(id, direction) {
  const images = Array.isArray(articleItems.find(item => item.id === id)?.images) ? articleItems.find(item => item.id === id).images : [];
  if (!images.length) return;
  const currentIndex = articleCarouselIndexes[id] ?? 0;
  const nextIndex = (currentIndex + direction + images.length) % images.length;
  articleCarouselIndexes[id] = nextIndex;
  renderArticleList();
}
window.changeArticleCardImage = changeArticleCardImage;

function formatTimestamp(value) {
  if (!value) return '-';
  let date;
  if (value?.toDate) date = value.toDate();
  else if (typeof value === 'object' && value.seconds) date = new Date(value.seconds * 1000);
  else date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function loadEvents() {
  try {
    const snap = await getDocs(query(collection(db, 'events'), orderBy('order', 'desc')));
    eventItems = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    eventPage = 1;
    renderEventList();
  } catch (e) {
    console.error('loadEvents:', e);
  }
}

function openEventDetail(id) {
  const item = eventItems.find(ev => ev.id === id);
  if (!item) return;
  const overlay = document.getElementById('eventDetailOverlay');
  const mediaEl = document.getElementById('eventDetailMedia');
  const titleEl = document.getElementById('eventDetailTitle');
  const dateEl = document.getElementById('eventDetailDate');
  const descEl = document.getElementById('eventDetailDescription');

  if (!overlay || !mediaEl || !titleEl || !dateEl || !descEl) return;

  titleEl.textContent = item.judul || '-';
  dateEl.textContent = formatIndonesianDate(item.tanggal) || '-';
  const countdownText = getEventCountdown(item.tanggal);
  const countdownEl = document.getElementById('eventDetailCountdown');
  if (countdownEl) countdownEl.textContent = countdownText;
  descEl.textContent = item.deskripsi || '-';

  if (item.mediaBase64) {
    if (item.mediaType === 'video') {
      mediaEl.innerHTML = `<video src="${item.mediaBase64}" controls playsinline preload="metadata"></video>`;
    } else {
      mediaEl.innerHTML = `<img src="${item.mediaBase64}" alt="${item.judul || 'Event'}" loading="lazy"/>`;
    }
  } else {
    mediaEl.innerHTML = `<div style="padding:60px 0;text-align:center;color:var(--muted)">Tidak ada media</div>`;
  }

  overlay.classList.add('open');
}

function closeEventDetail() {
  const overlay = document.getElementById('eventDetailOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
}

window.openEventDetail = openEventDetail;
window.closeEventDetail = closeEventDetail;

async function loadArticles() {
  try {
    const snap = await getDocs(query(collection(db, 'articles'), orderBy('order', 'desc')));
    articleItems = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    articlePage = 1;
    renderArticleList();
  } catch (e) {
    console.error('loadArticles:', e);
  }
}

function openArticleDetail(id) {
  const item = articleItems.find(article => article.id === id);
  if (!item) return;
  currentArticleDetailId = id;
  currentArticleDetailIndex = 0;
  const overlay = document.getElementById('articleDetailOverlay');
  const titleEl = document.getElementById('articleDetailTitle');
  const timestampEl = document.getElementById('articleDetailTimestamp');
  const descEl = document.getElementById('articleDetailDescription');
  if (!overlay || !titleEl || !timestampEl || !descEl) return;
  titleEl.textContent = item.judul || '-';
  timestampEl.textContent = formatTimestamp(item.createdAt);
  descEl.textContent = item.deskripsi || '-';
  renderArticleDetailImage(item);
  overlay.classList.add('open');
}

function renderArticleDetailImage(item) {
  const mediaEl = document.getElementById('articleDetailMedia');
  if (!mediaEl) return;
  const images = Array.isArray(item.images) ? item.images : [];
  if (!images.length) {
    mediaEl.innerHTML = `<div style="padding:80px 0;text-align:center;color:var(--text-muted)">Tidak ada gambar</div>`;
    return;
  }
  const image = images[currentArticleDetailIndex] || images[0];
  const dots = images.length > 1
    ? `<div class="article-detail-dots">${images.map((_, idx) => `<span class="article-detail-dot ${idx === currentArticleDetailIndex ? 'active' : ''}"></span>`).join('')}</div>`
    : '';
  mediaEl.innerHTML = `
    <div class="article-media">
      <img src="${image}" alt="${item.judul || 'Artikel'}" loading="lazy"/>
      ${images.length > 1 ? `
        <button class="article-carousel-btn prev" onclick="event.stopPropagation(); changeArticleDetailImage(-1)">‹</button>
        <button class="article-carousel-btn next" onclick="event.stopPropagation(); changeArticleDetailImage(1)">›</button>
      ` : ''}
      ${dots}
    </div>`;
}

function changeArticleDetailImage(direction) {
  if (!currentArticleDetailId) return;
  const item = articleItems.find(article => article.id === currentArticleDetailId);
  if (!item || !Array.isArray(item.images) || item.images.length < 2) return;
  currentArticleDetailIndex = (currentArticleDetailIndex + direction + item.images.length) % item.images.length;
  renderArticleDetailImage(item);
}

function closeArticleDetail() {
  const overlay = document.getElementById('articleDetailOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  currentArticleDetailId = null;
  currentArticleDetailIndex = 0;
}

window.openArticleDetail = openArticleDetail;
window.closeArticleDetail = closeArticleDetail;
window.changeArticleDetailImage = changeArticleDetailImage;

(async () => {
  try {
    const panoSnap = await getDoc(doc(db, 'panorama', 'hero_bg'));
    const heroSrc = panoSnap.exists() && panoSnap.data().base64 ? panoSnap.data().base64 : 'images/hero-360.png';
    startHero(heroSrc);
  } catch (e) { startHero('images/hero-360.png'); }
  await Promise.all([loadMasjidInfo(), loadPengurus(), loadImamMuadzin(), loadEvents(), loadArticles()]);
  getPrayerTimes();
  loadQuoteOfTheDay();
})();
