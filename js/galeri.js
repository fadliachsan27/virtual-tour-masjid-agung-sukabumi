import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy }
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

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
window.addEventListener('scroll', () => { document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 60); });
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

let galeriSrcs = [], lightboxIdx = 0;

async function loadAndRenderGaleri() {
  const groupsContainer = document.getElementById('galeriGroups');
  try {
    const snap = await getDocs(query(collection(db, 'galeri'), orderBy('order', 'asc')));
    if (snap.empty) { renderEmpty(groupsContainer); return; }
    groupsContainer.innerHTML = ''; galeriSrcs = [];
    const fotoLuar = [], fotoDalam = [];
    snap.forEach(d => {
      const item = d.data();
      if (!item.base64) return;
      if (item.kategori === 'dalam') fotoDalam.push(item);
      else fotoLuar.push(item);
    });
    if (fotoLuar.length === 0 && fotoDalam.length === 0) { renderEmpty(groupsContainer); return; }

    const totalFoto = fotoLuar.length + fotoDalam.length;
    let startIndex = 0;
    startIndex = renderGroup(groupsContainer, 'Foto Bagian Luar', fotoLuar, startIndex, totalFoto);
    renderGroup(groupsContainer, 'Foto Bagian Dalam', fotoDalam, startIndex, totalFoto);
  } catch (e) { renderEmpty(groupsContainer); console.error(e); }
}

function renderGroup(container, title, items, startIndex, totalFoto) {
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
    el.onclick = () => openLightbox(idx);
    el.innerHTML = `<img src="${item.base64}" alt="${title}" loading="lazy"/>
      <div class="galeri-item-num">${startIndex + localIndex + 1} / ${totalFoto}</div>`;
    grid.appendChild(el);
  });
  group.appendChild(grid);
  container.appendChild(group);
  return startIndex + items.length;
}

function renderEmpty(container) {
  container.innerHTML = '<div class="galeri-empty"><div class="galeri-empty-icon">🖼️</div><div class="galeri-empty-title">Belum Ada Foto</div><div class="galeri-empty-sub">Silakan masukkan foto melalui <a href="admin/login.html" style="color:var(--gold)">Admin Panel</a>.</div></div>';
}

function openLightbox(idx) {
  lightboxIdx = idx;
  document.getElementById('lightboxImg').src = galeriSrcs[idx];
  document.getElementById('lightbox').classList.add('active');
  document.getElementById('lightboxCounter').textContent = (idx + 1) + ' / ' + galeriSrcs.length;
}
window.closeLightbox = () => document.getElementById('lightbox').classList.remove('active');
window.lightboxNav = (dir) => {
  lightboxIdx = (lightboxIdx + dir + galeriSrcs.length) % galeriSrcs.length;
  document.getElementById('lightboxImg').src = galeriSrcs[lightboxIdx];
  document.getElementById('lightboxCounter').textContent = (lightboxIdx + 1) + ' / ' + galeriSrcs.length;
};
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'ArrowLeft') window.lightboxNav(-1);
  if (e.key === 'ArrowRight') window.lightboxNav(1);
  if (e.key === 'Escape') window.closeLightbox();
});
document.getElementById('lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) window.closeLightbox(); });

loadAndRenderGaleri();
