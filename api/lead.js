export default async function handler(req, res) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug.trim() : '';
  if (!slug) {
    res.status(400).json({ error: 'slug required' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('lead: supabase env not configured', { slug });
    res.status(500).json({ error: 'supabase env not configured' });
    return;
  }

  try {
    const url = `${supabaseUrl}/rest/v1/leads?slug=eq.${encodeURIComponent(slug)}&select=website,video_url,company_short_name&limit=1`;
    const resp = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) {
      console.warn('lead: upstream non-ok', { slug, status: resp.status });
      res.status(resp.status).json({ error: 'lookup failed' });
      return;
    }
    const rows = await resp.json();
    const rowCount = Array.isArray(rows) ? rows.length : 'non-array';
    const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
    const website = row && typeof row.website === 'string' ? row.website : '';
    const videoUrl = row && typeof row.video_url === 'string' ? row.video_url : '';
    const companyShortName = row && typeof row.company_short_name === 'string' ? row.company_short_name : '';
    console.log('lead: decided', { slug, status: resp.status, rows: rowCount, website_present: website !== '', video_present: videoUrl !== '' });
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).json({ website, video_url: videoUrl, company_short_name: companyShortName });
  } catch (err) {
    console.error('lead lookup error:', { slug, err: String(err) });
    res.status(500).json({ error: 'internal' });
  }
}
