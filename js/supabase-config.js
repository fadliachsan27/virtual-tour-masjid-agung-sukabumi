/**
 * Kredensial Supabase (anon key + URL) untuk situs statis.
 *
 * Produksi: isi VT_SUPABASE_URL dan VT_SUPABASE_ANON_KEY di bawah supaya
 * halaman galeri.html bisa memuat foto untuk semua pengunjung (mereka tidak
 * membuka panel admin, jadi localStorage dari admin tidak ikut).
 * URL harus tanpa path API, contoh salah: …supabase.co/rest/v1/
 *
 * Uji cepat: bisa juga isi lewat Admin > Pengaturan > Supabase (tersimpan
 * di localStorage browser itu — hanya berlaku untuk browser yang sama).
 */
window.VT_SUPABASE_URL =  window.VT_SUPABASE_URL || 'https://pqipurfqkcuyrfmexgyo.supabase.co';

window.VT_SUPABASE_ANON_KEY =
  window.VT_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaXB1cmZxa2N1eXJmbWV4Z3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ5MTIwMSwiZXhwIjoyMDk0MDY3MjAxfQ.y__FSp5nxpCcNj8Qkf5vPLKLrAsb_utW6aWw8OgoXXM';

/**
 * Client JS hanya boleh memakai base project URL.
 * Jangan sertakan /rest/v1/ atau /storage/v1/ (sering ter-copy dari dokumentasi API).
 */
function vtNormalizeSupabaseUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let u = raw.trim().replace(/\/+$/, '');
  u = u.replace(/\/rest\/v1$/i, '');
  u = u.replace(/\/storage\/v1$/i, '');
  u = u.replace(/\/auth\/v1$/i, '');
  return u.replace(/\/+$/, '');
}

function vtGetSupabaseCredentials() {
  const rawUrl =
    localStorage.getItem('vt_supabase_url') ||
    window.VT_SUPABASE_URL ||
    'https://pqipurfqkcuyrfmexgyo.supabase.co';
  const key = (
    localStorage.getItem('vt_supabase_anon_key') ||
    window.VT_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaXB1cmZxa2N1eXJmbWV4Z3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ5MTIwMSwiZXhwIjoyMDk0MDY3MjAxfQ.y__FSp5nxpCcNj8Qkf5vPLKLrAsb_utW6aWw8OgoXXM'
  ).trim();
  const url = vtNormalizeSupabaseUrl(rawUrl);
  return { url, key };
}

function vtSupabaseConfigured() {
  const c = vtGetSupabaseCredentials();
  return Boolean(c.url && c.key);
}

let vtSupabaseClient = null;

function vtResetSupabaseClient() {
  vtSupabaseClient = null;
}

function vtGetSupabase() {
  if (!vtSupabaseConfigured()) return null;
  if (typeof supabase === 'undefined' || !supabase.createClient) return null;
  if (!vtSupabaseClient) {
    const c = vtGetSupabaseCredentials();
    vtSupabaseClient = supabase.createClient(c.url, c.key);
  }
  return vtSupabaseClient;
}

/** Path di bucket `galeri` dari URL publik Supabase Storage */
function vtGaleriStoragePathFromUrl(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  const marker = '/object/public/galeri/';
  const i = publicUrl.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(publicUrl.slice(i + marker.length));
}
