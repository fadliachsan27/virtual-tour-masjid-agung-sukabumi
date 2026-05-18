// ================================================================
// FIREBASE CONFIGURATION - Masjid Agung Sukabumi
// Foto disimpan sebagai Base64 di Firestore (TANPA Firebase Storage)
// ================================================================
// LANGKAH SETUP:
// 1. Buka https://console.firebase.google.com
// 2. Buat/pilih project → klik ikon </> (Web) → copy firebaseConfig
// 3. Ganti nilai di bawah ini dengan config milik Anda
// 4. Di Firestore Rules, set: allow read, write: if true; (untuk dev)
// ================================================================

export const firebaseConfig = {
  apiKey: "GANTI_API_KEY",
  authDomain: "GANTI_AUTH_DOMAIN",
  projectId: "GANTI_PROJECT_ID",
  messagingSenderId: "GANTI_SENDER_ID",
  appId: "GANTI_APP_ID"
  // TIDAK PERLU storageBucket — kita tidak pakai Firebase Storage
};

// ================================================================
// STRUKTUR FIRESTORE:
//
// Collection: masjid_info
//   └── doc: info   → { judul, deskripsi, kapasitas, berdiri, luas, menara }
//   └── doc: fitur  → { items: [{icon, judul, deskripsi}] }
//
// Collection: pengurus
//   └── doc: {id}   → { nama, jabatan, periode, fotoBase64, order, createdAt }
//
// Collection: imam_muadzin
//   └── doc: jadwal → { imam: [{hari,nama,keterangan}], muadzin: [...] }
//
// Collection: galeri
//   └── doc: {id}   → { base64, order, createdAt }
//
// Collection: panorama
//   └── doc: hero_bg → { base64 }
//   └── doc: pano_0  → { base64 }
//   └── doc: pano_1  → { base64 }
//   └── doc: pano_2  → { base64 }
//   └── doc: pano_3  → { base64 }
//
// Collection: admin_settings
//   └── doc: credentials → { username, password }
// ================================================================
