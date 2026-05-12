-- ============================================================
--  VIRTUAL TOUR MASJID AGUNG SUKABUMI — Supabase Schema (gabungan v2, idempotent)
--  Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. INFORMASI MASJID
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS masjid_info (
  id          SERIAL PRIMARY KEY,
  judul       TEXT,
  deskripsi   TEXT,
  kapasitas   TEXT,
  berdiri     TEXT,
  luas        TEXT,
  menara      TEXT,
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fitur_masjid (
  id          SERIAL PRIMARY KEY,
  icon        TEXT,
  judul       TEXT NOT NULL,
  deskripsi   TEXT,
  urutan      INT DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pengurus (
  id          SERIAL PRIMARY KEY,
  nama        TEXT NOT NULL,
  jabatan     TEXT NOT NULL,
  periode     TEXT,
  foto_url    TEXT,
  urutan      INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imam_harian (
  id          SERIAL PRIMARY KEY,
  hari        TEXT NOT NULL,
  nama_imam   TEXT NOT NULL,
  keterangan  TEXT,
  urutan      INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS muadzin_harian (
  id            SERIAL PRIMARY KEY,
  hari          TEXT NOT NULL,
  nama_muadzin  TEXT NOT NULL,
  keterangan    TEXT,
  urutan        INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS galeri (
  id          SERIAL PRIMARY KEY,
  url         TEXT NOT NULL,
  caption     TEXT,
  urutan      INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hero_background (
  id          SERIAL PRIMARY KEY,
  url         TEXT,
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO hero_background (id, url) VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
--  VIRTUAL TOUR
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tour_kategori (
  id          SERIAL PRIMARY KEY,
  nama        TEXT NOT NULL,
  icon        TEXT DEFAULT '🏛️',
  urutan      INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO tour_kategori (nama, icon, urutan)
SELECT v.nama, v.icon, v.urutan
FROM (VALUES
  ('Ruang Ibadah',   '🕌', 1),
  ('Area Fasilitas', '🏛️', 2),
  ('Area Luar',      '🌿', 3)
) AS v(nama, icon, urutan)
WHERE NOT EXISTS (SELECT 1 FROM tour_kategori tk WHERE tk.nama = v.nama);

CREATE TABLE IF NOT EXISTS tour_spot (
  id            SERIAL PRIMARY KEY,
  kategori_id   INT REFERENCES tour_kategori(id) ON DELETE SET NULL,
  nama          TEXT NOT NULL,
  deskripsi     TEXT,
  icon          TEXT DEFAULT '📍',
  sub_label     TEXT,
  foto_url      TEXT,
  thumbnail_url TEXT,
  yaw_awal      FLOAT DEFAULT 0,
  pitch_awal    FLOAT DEFAULT 0,
  hfov          FLOAT DEFAULT 100,
  is_aktif      BOOLEAN DEFAULT TRUE,
  urutan        INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

INSERT INTO tour_spot (nama, deskripsi, icon, sub_label, urutan, kategori_id)
SELECT v.nama, v.deskripsi, v.icon, v.sub_label, v.urutan, tk.id
FROM (VALUES
  ('Ruang Utama (Mihrab)', 'Pusat ibadah dengan mihrab megah dan kubah utama yang indah. Area ini dapat menampung ribuan jamaah.', '🕌', 'Area Shalat Utama', 1, 'Ruang Ibadah'),
  ('Aula & Selasar',       'Area multifungsi yang digunakan untuk kegiatan pengajian, pertemuan, dan acara keagamaan lainnya.',    '🏛️', 'Area Multifungsi',   2, 'Area Fasilitas'),
  ('Halaman & Taman',      'Area luar masjid yang asri dengan taman indah, tempat wudhu, dan area parkir yang luas.',              '🌿', 'Area Luar Masjid',   3, 'Area Luar'),
  ('Menara & Kubah',       'Menara megah yang menjulang tinggi dan kubah indah, menjadi landmark kebanggaan Kota Sukabumi.',       '🔔', 'Landmark Masjid',    4, 'Area Luar')
) AS v(nama, deskripsi, icon, sub_label, urutan, kat_nama)
JOIN tour_kategori tk ON tk.nama = v.kat_nama
WHERE NOT EXISTS (SELECT 1 FROM tour_spot s WHERE s.nama = v.nama);

CREATE TABLE IF NOT EXISTS tour_hotspot (
  id              SERIAL PRIMARY KEY,
  spot_id         INT NOT NULL REFERENCES tour_spot(id) ON DELETE CASCADE,
  target_spot_id  INT REFERENCES tour_spot(id) ON DELETE SET NULL,
  tipe            TEXT DEFAULT 'scene',
  label           TEXT,
  pitch           FLOAT DEFAULT 0,
  yaw             FLOAT DEFAULT 0,
  url_eksternal   TEXT,
  isi_info        TEXT,
  is_aktif        BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
--  RLS
-- ═══════════════════════════════════════════════════════════

ALTER TABLE masjid_info      ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitur_masjid     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus         ENABLE ROW LEVEL SECURITY;
ALTER TABLE imam_harian      ENABLE ROW LEVEL SECURITY;
ALTER TABLE muadzin_harian   ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeri           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_background  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_kategori    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_spot        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_hotspot     ENABLE ROW LEVEL SECURITY;

-- Drop lalu buat ulang agar skrip aman dijalankan berkali-kali
DROP POLICY IF EXISTS "read_masjid_info"    ON masjid_info;
DROP POLICY IF EXISTS "read_fitur"          ON fitur_masjid;
DROP POLICY IF EXISTS "read_pengurus"       ON pengurus;
DROP POLICY IF EXISTS "read_imam"           ON imam_harian;
DROP POLICY IF EXISTS "read_muadzin"        ON muadzin_harian;
DROP POLICY IF EXISTS "read_galeri"         ON galeri;
DROP POLICY IF EXISTS "read_hero"           ON hero_background;
DROP POLICY IF EXISTS "read_tour_kategori"  ON tour_kategori;
DROP POLICY IF EXISTS "read_tour_spot"      ON tour_spot;
DROP POLICY IF EXISTS "read_tour_hotspot"   ON tour_hotspot;
DROP POLICY IF EXISTS "write_masjid_info"   ON masjid_info;
DROP POLICY IF EXISTS "write_fitur"         ON fitur_masjid;
DROP POLICY IF EXISTS "write_pengurus"      ON pengurus;
DROP POLICY IF EXISTS "write_imam"          ON imam_harian;
DROP POLICY IF EXISTS "write_muadzin"       ON muadzin_harian;
DROP POLICY IF EXISTS "write_galeri"        ON galeri;
DROP POLICY IF EXISTS "write_hero"          ON hero_background;
DROP POLICY IF EXISTS "write_tour_kategori" ON tour_kategori;
DROP POLICY IF EXISTS "write_tour_spot"     ON tour_spot;
DROP POLICY IF EXISTS "write_tour_hotspot"  ON tour_hotspot;

CREATE POLICY "read_masjid_info"    ON masjid_info    FOR SELECT USING (true);
CREATE POLICY "read_fitur"          ON fitur_masjid   FOR SELECT USING (true);
CREATE POLICY "read_pengurus"       ON pengurus      FOR SELECT USING (true);
CREATE POLICY "read_imam"           ON imam_harian    FOR SELECT USING (true);
CREATE POLICY "read_muadzin"        ON muadzin_harian FOR SELECT USING (true);
CREATE POLICY "read_galeri"         ON galeri         FOR SELECT USING (true);
CREATE POLICY "read_hero"           ON hero_background FOR SELECT USING (true);
CREATE POLICY "read_tour_kategori"  ON tour_kategori FOR SELECT USING (true);
CREATE POLICY "read_tour_spot"      ON tour_spot      FOR SELECT USING (true);
CREATE POLICY "read_tour_hotspot"   ON tour_hotspot  FOR SELECT USING (true);

CREATE POLICY "write_masjid_info"   ON masjid_info    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_fitur"         ON fitur_masjid   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_pengurus"      ON pengurus      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_imam"          ON imam_harian    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_muadzin"       ON muadzin_harian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_galeri"        ON galeri         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_hero"          ON hero_background FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_tour_kategori" ON tour_kategori FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_tour_spot"     ON tour_spot     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_tour_hotspot"  ON tour_hotspot  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
--  STORAGE
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('panorama',      'panorama',      true),
  ('galeri',        'galeri',        true),
  ('pengurus-foto', 'pengurus-foto', true),
  ('hero',          'hero',          true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_panorama"      ON storage.objects;
DROP POLICY IF EXISTS "public_read_galeri"        ON storage.objects;
DROP POLICY IF EXISTS "public_read_pengurus_foto" ON storage.objects;
DROP POLICY IF EXISTS "public_read_hero"          ON storage.objects;
DROP POLICY IF EXISTS "admin_write_panorama"      ON storage.objects;
DROP POLICY IF EXISTS "admin_write_galeri"        ON storage.objects;
DROP POLICY IF EXISTS "admin_write_pengurus_foto" ON storage.objects;
DROP POLICY IF EXISTS "admin_write_hero"          ON storage.objects;

CREATE POLICY "public_read_panorama"      ON storage.objects FOR SELECT USING (bucket_id = 'panorama');
CREATE POLICY "public_read_galeri"        ON storage.objects FOR SELECT USING (bucket_id = 'galeri');
CREATE POLICY "public_read_pengurus_foto" ON storage.objects FOR SELECT USING (bucket_id = 'pengurus-foto');
CREATE POLICY "public_read_hero"          ON storage.objects FOR SELECT USING (bucket_id = 'hero');

CREATE POLICY "admin_write_panorama"      ON storage.objects FOR ALL USING (bucket_id = 'panorama') WITH CHECK (bucket_id = 'panorama');
CREATE POLICY "admin_write_galeri"        ON storage.objects FOR ALL USING (bucket_id = 'galeri') WITH CHECK (bucket_id = 'galeri');
CREATE POLICY "admin_write_pengurus_foto" ON storage.objects FOR ALL USING (bucket_id = 'pengurus-foto') WITH CHECK (bucket_id = 'pengurus-foto');
CREATE POLICY "admin_write_hero"          ON storage.objects FOR ALL USING (bucket_id = 'hero') WITH CHECK (bucket_id = 'hero');

-- ═══════════════════════════════════════════════════════════
--  GRANT (wajib untuk API browser / anon key)
--  Tanpa ini: "permission denied for table galeri" walau RLS sudah ada.
-- ═══════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON masjid_info     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fitur_masjid    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pengurus        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON imam_harian     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON muadzin_harian  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON galeri          TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hero_background TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tour_kategori   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tour_spot      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tour_hotspot    TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
