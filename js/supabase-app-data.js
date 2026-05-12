/**
 * CRUD data masjid, pengurus, jadwal, hero, tour_spot lewat Supabase.
 * Membutuhkan: supabase-config.js (vtGetSupabase, vtGaleriStoragePathFromUrl untuk pola path).
 */
(function () {
  function sb() {
    return typeof vtGetSupabase === 'function' ? vtGetSupabase() : null;
  }

  function active() {
    return !!sb();
  }

  function publicPathFromUrl(bucket, publicUrl) {
    if (!publicUrl || typeof publicUrl !== 'string') return null;
    const marker = '/object/public/' + bucket + '/';
    const i = publicUrl.indexOf(marker);
    if (i === -1) return null;
    return decodeURIComponent(publicUrl.slice(i + marker.length));
  }

  async function removePublicFile(bucket, publicUrl) {
    const path = publicPathFromUrl(bucket, publicUrl);
    if (!path) return;
    const { error } = await sb().storage.from(bucket).remove([path]);
    if (error) console.warn('storage remove', bucket, error.message);
  }

  // ---------- masjid_info + fitur_masjid ----------
  async function loadMasjidAndFitur() {
    const c = sb();
    const { data: infoRows, error: e1 } = await c
      .from('masjid_info')
      .select('*')
      .order('id', { ascending: true })
      .limit(1);
    if (e1) throw e1;
    const info = infoRows && infoRows.length ? infoRows[0] : null;

    const { data: fitur, error: e2 } = await c
      .from('fitur_masjid')
      .select('id,icon,judul,deskripsi,urutan')
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });
    if (e2) throw e2;

    const fiturRows = (fitur || []).map((r) => ({
      id: r.id,
      icon: r.icon || '🕌',
      judul: r.judul || '',
      deskripsi: r.deskripsi || '',
    }));
    return { info, fiturRows };
  }

  async function saveMasjidAndFitur(info, fiturRows) {
    const c = sb();
    const row = {
      id: 1,
      judul: info.judul || null,
      deskripsi: info.deskripsi || null,
      kapasitas: info.kapasitas || null,
      berdiri: info.berdiri || null,
      luas: info.luas || null,
      menara: info.menara || null,
      updated_at: new Date().toISOString(),
    };
    const { error: e1 } = await c.from('masjid_info').upsert([row], { onConflict: 'id' });
    if (e1) throw e1;

    const { error: delErr } = await c.from('fitur_masjid').delete().neq('id', -1);
    if (delErr) throw delErr;

    if (fiturRows && fiturRows.length) {
      const ins = fiturRows.map((f, i) => ({
        icon: f.icon || '🕌',
        judul: f.judul || '',
        deskripsi: f.deskripsi || '',
        urutan: i,
      }));
      const { error: insErr } = await c.from('fitur_masjid').insert(ins);
      if (insErr) throw insErr;
    }
  }

  // ---------- pengurus ----------
  async function loadPengurusRows() {
    const { data, error } = await sb()
      .from('pengurus')
      .select('id,nama,jabatan,periode,foto_url,urutan')
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function nextPengurusUrutan() {
    const { data } = await sb()
      .from('pengurus')
      .select('urutan')
      .order('urutan', { ascending: false })
      .limit(1);
    if (!data || !data.length) return 0;
    const u = data[0].urutan;
    return (typeof u === 'number' ? u : 0) + 1;
  }

  async function uploadPengurusFoto(blob) {
    const name = Date.now() + '_' + Math.random().toString(36).slice(2, 9) + '.jpg';
    const { error: upErr } = await sb()
      .storage.from('pengurus-foto')
      .upload(name, blob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb().storage.from('pengurus-foto').getPublicUrl(name);
    return pub.publicUrl;
  }

  async function insertPengurus({ nama, jabatan, periode, fotoBlob }) {
    let foto_url = null;
    if (fotoBlob) foto_url = await uploadPengurusFoto(fotoBlob);
    const urutan = await nextPengurusUrutan();
    const { data, error } = await sb()
      .from('pengurus')
      .insert({ nama, jabatan, periode: periode || null, foto_url, urutan })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  async function updatePengurus(id, { nama, jabatan, periode, fotoBlob, oldFotoUrl }) {
    let foto_url = oldFotoUrl || null;
    if (fotoBlob) {
      foto_url = await uploadPengurusFoto(fotoBlob);
      if (oldFotoUrl) await removePublicFile('pengurus-foto', oldFotoUrl);
    }
    const { error } = await sb()
      .from('pengurus')
      .update({
        nama,
        jabatan,
        periode: periode || null,
        foto_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  }

  async function deletePengurus(id, fotoUrl) {
    if (fotoUrl) await removePublicFile('pengurus-foto', fotoUrl);
    const { error } = await sb().from('pengurus').delete().eq('id', id);
    if (error) throw error;
  }

  // ---------- imam / muadzin ----------
  async function loadImamRows() {
    const { data, error } = await sb()
      .from('imam_harian')
      .select('hari,nama_imam,keterangan,urutan')
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map((r) => ({
      hari: r.hari,
      nama: r.nama_imam,
      keterangan: r.keterangan || '',
    }));
  }

  async function loadMuadzinRows() {
    const { data, error } = await sb()
      .from('muadzin_harian')
      .select('hari,nama_muadzin,keterangan,urutan')
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map((r) => ({
      hari: r.hari,
      nama: r.nama_muadzin,
      keterangan: r.keterangan || '',
    }));
  }

  async function saveJadwal(imamList, muadzinList) {
    const c = sb();
    const { error: d1 } = await c.from('imam_harian').delete().neq('id', -1);
    if (d1) throw d1;
    const { error: d2 } = await c.from('muadzin_harian').delete().neq('id', -1);
    if (d2) throw d2;

    if (imamList && imamList.length) {
      const rows = imamList.map((r, i) => ({
        hari: r.hari,
        nama_imam: r.nama,
        keterangan: r.keterangan || null,
        urutan: i,
      }));
      const { error } = await c.from('imam_harian').insert(rows);
      if (error) throw error;
    }
    if (muadzinList && muadzinList.length) {
      const rows = muadzinList.map((r, i) => ({
        hari: r.hari,
        nama_muadzin: r.nama,
        keterangan: r.keterangan || null,
        urutan: i,
      }));
      const { error } = await c.from('muadzin_harian').insert(rows);
      if (error) throw error;
    }
  }

  // ---------- hero ----------
  async function getHeroUrl() {
    const { data, error } = await sb()
      .from('hero_background')
      .select('url')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    return data && data.url ? data.url : null;
  }

  async function saveHeroBlob(blob) {
    const name = 'hero_' + Date.now() + '.jpg';
    const { error: upErr } = await sb()
      .storage.from('hero')
      .upload(name, blob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb().storage.from('hero').getPublicUrl(name);
    const url = pub.publicUrl;

    const oldUrl = await getHeroUrl();
    if (oldUrl) await removePublicFile('hero', oldUrl);

    const { error } = await sb()
      .from('hero_background')
      .update({ url, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) throw error;
    return url;
  }

  async function clearHeroUrl() {
    const old = await getHeroUrl();
    if (old) await removePublicFile('hero', old);
    await sb()
      .from('hero_background')
      .update({ url: null, updated_at: new Date().toISOString() })
      .eq('id', 1);
  }

  // ---------- tour_spot (panorama) ----------
  async function loadTourSpotsOrdered() {
    const { data, error } = await sb()
      .from('tour_spot')
      .select('id,nama,deskripsi,icon,sub_label,foto_url,yaw_awal,pitch_awal,hfov,urutan')
      .eq('is_aktif', true)
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function updateTourSpotFoto(spotId, blob) {
    const name = 'pano_' + spotId + '_' + Date.now() + '.jpg';
    const { error: upErr } = await sb()
      .storage.from('panorama')
      .upload(name, blob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb().storage.from('panorama').getPublicUrl(name);
    const url = pub.publicUrl;

    const { data: row } = await sb()
      .from('tour_spot')
      .select('foto_url')
      .eq('id', spotId)
      .maybeSingle();
    if (row && row.foto_url) await removePublicFile('panorama', row.foto_url);

    const { error } = await sb()
      .from('tour_spot')
      .update({ foto_url: url, updated_at: new Date().toISOString() })
      .eq('id', spotId);
    if (error) throw error;
    return url;
  }

  async function clearTourSpotFoto(spotId) {
    const { data: row } = await sb()
      .from('tour_spot')
      .select('foto_url')
      .eq('id', spotId)
      .maybeSingle();
    if (row && row.foto_url) await removePublicFile('panorama', row.foto_url);
    const { error } = await sb()
      .from('tour_spot')
      .update({ foto_url: null, updated_at: new Date().toISOString() })
      .eq('id', spotId);
    if (error) throw error;
  }

  async function countPengurus() {
    const { count, error } = await sb()
      .from('pengurus')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  }
  async function countImam() {
    const { count, error } = await sb()
      .from('imam_harian')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  }
  async function countMuadzin() {
    const { count, error } = await sb()
      .from('muadzin_harian')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  }

  window.vtRemote = {
    active,
    loadMasjidAndFitur,
    saveMasjidAndFitur,
    loadPengurusRows,
    insertPengurus,
    updatePengurus,
    deletePengurus,
    loadImamRows,
    loadMuadzinRows,
    saveJadwal,
    getHeroUrl,
    saveHeroBlob,
    clearHeroUrl,
    loadTourSpotsOrdered,
    updateTourSpotFoto,
    clearTourSpotFoto,
    countPengurus,
    countImam,
    countMuadzin,
  };
})();
