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

function loadQuoteOfTheDay() {
  const today = new Date().getDate();
  const quote = quotes[today % quotes.length];
  const quoteText = document.getElementById("quoteText");
  const quoteSource = document.getElementById("quoteSource");
  if (quoteText) quoteText.textContent = `“${quote.text}”`;
  if (quoteSource) quoteSource.textContent = `— ${quote.source}`;
}

(async () => {
  try {
    const panoSnap = await getDoc(doc(db, 'panorama', 'hero_bg'));
    const heroSrc = panoSnap.exists() && panoSnap.data().base64 ? panoSnap.data().base64 : 'images/hero-360.png';
    startHero(heroSrc);
  } catch (e) { startHero('images/hero-360.png'); }
  await Promise.all([loadMasjidInfo(), loadPengurus(), loadImamMuadzin()]);
  getPrayerTimes();
  loadQuoteOfTheDay();
})();
