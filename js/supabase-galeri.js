(function () {
  async function fetchRows() {
    const sb = vtGetSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('galeri')
      .select('id,url,caption,urutan')
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function countRows() {
    const sb = vtGetSupabase();
    if (!sb) return null;
    const { count, error } = await sb
      .from('galeri')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  }

  async function nextUrutan() {
    const sb = vtGetSupabase();
    const { data, error } = await sb
      .from('galeri')
      .select('urutan')
      .order('urutan', { ascending: false })
      .limit(1);
    if (error) throw error;
    if (!data || !data.length) return 0;
    const u = data[0].urutan;
    return typeof u === 'number' ? u + 1 : 0;
  }

  async function uploadBlob(blob) {
    const sb = vtGetSupabase();
    const name =
      Date.now() + '_' + Math.random().toString(36).slice(2, 11) + '.jpg';
    const { error: upErr } = await sb.storage
      .from('galeri')
      .upload(name, blob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb.storage.from('galeri').getPublicUrl(name);
    const publicUrl = pub.publicUrl;
    const urutan = await nextUrutan();
    const { data: ins, error: insErr } = await sb
      .from('galeri')
      .insert({ url: publicUrl, caption: null, urutan })
      .select('id,url')
      .single();
    if (insErr) throw insErr;
    return { id: ins.id, url: ins.url };
  }

  async function removeStorageByUrl(url) {
    const sb = vtGetSupabase();
    const path = vtGaleriStoragePathFromUrl(url);
    if (path) {
      const { error } = await sb.storage.from('galeri').remove([path]);
      if (error) console.warn('vt galeri storage remove:', error.message);
    }
  }

  async function deleteById(id, url) {
    const sb = vtGetSupabase();
    await removeStorageByUrl(url);
    const { error } = await sb.from('galeri').delete().eq('id', id);
    if (error) throw error;
  }

  async function replaceBlob(id, oldUrl, blob) {
    const sb = vtGetSupabase();
    const name =
      Date.now() + '_' + Math.random().toString(36).slice(2, 11) + '.jpg';
    const { error: upErr } = await sb.storage
      .from('galeri')
      .upload(name, blob, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = sb.storage.from('galeri').getPublicUrl(name);
    const publicUrl = pub.publicUrl;
    const { error: updErr } = await sb
      .from('galeri')
      .update({ url: publicUrl })
      .eq('id', id);
    if (updErr) throw updErr;
    await removeStorageByUrl(oldUrl);
    return { id, url: publicUrl };
  }

  async function deleteAll() {
    const sb = vtGetSupabase();
    const rows = await fetchRows();
    if (!rows) return;
    for (const r of rows) {
      await removeStorageByUrl(r.url);
    }
    const { error } = await sb.from('galeri').delete().neq('id', -1);
    if (error) throw error;
  }

  window.vtGaleriRemote = {
    fetchRows,
    countRows,
    uploadBlob,
    deleteById,
    replaceBlob,
    deleteAll,
  };
})();
